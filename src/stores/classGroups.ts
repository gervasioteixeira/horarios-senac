import { defineStore } from "pinia"
import { ref } from "vue"
import type { ClassGroup } from "../types"
import { LOCAL_STORAGE_KEYS, persistToLocalStorage, readFromLocalStorage } from "../composables/useLocalStorage"
import { calculateSchedule } from "../services/calendarEngine"
import { findCapacityConflict, findScheduleConflict, type CapacityConflict, type ScheduleConflict } from "../services/conflictChecker"
import { computePostponeDraft, computeRescheduleDraft } from "../services/rescheduler"
import { useHolidaysStore } from "./holidays"
import { useRoomsStore } from "./rooms"
import { useCoursesStore } from "./courses"
import { mergeHolidayDates } from "../services/holidayEngine"

function generateId(): string {
  return `class-${crypto.randomUUID()}`
}

export type ClassGroupDraft = Omit<
  ClassGroup,
  "id" | "computedEndDate" | "computedMonthlyBreakdown" | "computedClassDates" | "createdAt" | "updatedAt"
>

export interface SaveClassGroupResult {
  ok: boolean
  classGroup?: ClassGroup
  conflict?: ScheduleConflict
  capacityConflict?: CapacityConflict
}

export const useClassGroupsStore = defineStore("classGroups", () => {
  const classGroups = ref<ClassGroup[]>(readFromLocalStorage(LOCAL_STORAGE_KEYS.classGroups, []))
  persistToLocalStorage(LOCAL_STORAGE_KEYS.classGroups, classGroups)

  /** Roda o motor de calendário para um rascunho de turma, usando os feriados cadastrados. */
  function computeSchedule(
    draft: Pick<ClassGroupDraft, "startDate" | "dailyWorkloadHours" | "weekdays" | "postponements">,
    course: { totalWorkloadHours: number },
  ) {
    const holidaysStore = useHolidaysStore()
    const startYear = new Date(draft.startDate).getFullYear()
    // Garante feriados cobrindo alguns anos à frente, mesmo que a turma seja longa.
    for (let y = startYear; y <= startYear + 3; y++) {
      holidaysStore.ensureNationalHolidaysForYear(y)
    }
    const holidayDates = mergeHolidayDates(holidaysStore.nationalHolidays, holidaysStore.customHolidays)

    return calculateSchedule({
      startDate: draft.startDate,
      totalWorkloadHours: course.totalWorkloadHours,
      dailyWorkloadHours: draft.dailyWorkloadHours,
      weekdays: draft.weekdays,
      holidayDates,
      postponements: draft.postponements,
    })
  }

  /**
   * Salva (cria ou atualiza) uma turma, recalculando o calendário e
   * verificando, antes de persistir: (1) conflito de horário do
   * professor OU do espaço físico, e (2) se o número de alunos
   * previstos excede a capacidade do espaço. Se qualquer um ocorrer,
   * NÃO salva (regra de negócio 3, estendida a espaços físicos).
   *
   * Editar a turma pelo formulário sempre descarta qualquer ajuste
   * pontual de calendário (`postponements`) aplicado anteriormente por
   * arraste no calendário — mudar startDate/weekdays/carga diária
   * regenera o cronograma do zero, e uma âncora de ajuste antiga
   * ficaria órfã/sem sentido na nova sequência.
   */
  function save(draft: ClassGroupDraft, course: { totalWorkloadHours: number }, existingId?: string): SaveClassGroupResult {
    const schedule = computeSchedule({ ...draft, postponements: undefined }, course)

    const conflict = findScheduleConflict(
      {
        id: existingId,
        teacherId: draft.teacherId,
        roomId: draft.roomId,
        startDate: draft.startDate,
        endDate: schedule.endDate,
        weekdays: draft.weekdays,
        timeSlot: draft.timeSlot,
      },
      classGroups.value,
    )

    if (conflict) {
      return { ok: false, conflict }
    }

    if (draft.roomId) {
      const roomsStore = useRoomsStore()
      const capacityConflict = findCapacityConflict(draft.expectedStudents, roomsStore.getById(draft.roomId))
      if (capacityConflict) {
        return { ok: false, capacityConflict }
      }
    }

    const now = new Date().toISOString()

    if (existingId) {
      const existing = classGroups.value.find((c) => c.id === existingId)
      if (!existing) return { ok: false }
      Object.assign(existing, draft, {
        postponements: undefined,
        computedEndDate: schedule.endDate,
        computedMonthlyBreakdown: schedule.monthlyBreakdown,
        computedClassDates: schedule.classDates,
        updatedAt: now,
      })
      return { ok: true, classGroup: existing }
    }

    const classGroup: ClassGroup = {
      ...draft,
      postponements: undefined,
      id: generateId(),
      computedEndDate: schedule.endDate,
      computedMonthlyBreakdown: schedule.monthlyBreakdown,
      computedClassDates: schedule.classDates,
      createdAt: now,
      updatedAt: now,
    }
    classGroups.value.push(classGroup)
    return { ok: true, classGroup }
  }

  /**
   * Resultado de uma tentativa de reagendar (arrastar) uma turma no calendário.
   * `requiresAdvanceConfirmation: true` significa que nada foi salvo ainda —
   * a UI deve confirmar com o usuário a antecipação do curso e chamar
   * `reschedule` novamente com `confirmAdvance: true`.
   */
  interface RescheduleResult {
    ok: boolean
    classGroup?: ClassGroup
    conflict?: ScheduleConflict
    capacityConflict?: CapacityConflict
    requiresAdvanceConfirmation?: boolean
    proposedStartDate?: string
  }

  /**
   * Reagenda (por arraste no calendário) a turma inteira, deslocando sua
   * `startDate` pelo mesmo número de dias entre a aula arrastada e o dia
   * onde foi solta, e recalculando toda a turma a partir da nova data.
   *
   * Se a nova data de início for anterior à `startDate` atual (o curso
   * seria antecipado), NÃO salva e retorna `requiresAdvanceConfirmation`
   * — a UI deve confirmar com o usuário e chamar de novo com
   * `confirmAdvance: true` para efetivar. Conflito de horário (professor/
   * espaço) ou de capacidade também bloqueia o salvamento, como no `save()`.
   */
  function reschedule(
    id: string,
    draggedFromDate: string,
    draggedToDate: string,
    confirmAdvance = false,
  ): RescheduleResult {
    const existing = classGroups.value.find((c) => c.id === id)
    if (!existing) return { ok: false }

    const draft = computeRescheduleDraft({
      currentStartDate: existing.startDate,
      draggedFromDate,
      draggedToDate,
    })

    if (draft.deltaDays === 0) {
      return { ok: true, classGroup: existing }
    }

    if (draft.requiresAdvanceConfirmation && !confirmAdvance) {
      return { ok: false, requiresAdvanceConfirmation: true, proposedStartDate: draft.proposedStartDate }
    }

    const coursesStore = useCoursesStore()
    const course = coursesStore.getById(existing.courseId)
    if (!course) return { ok: false }

    // Mover a turma inteira regenera o cronograma do zero a partir da nova
    // startDate — qualquer ajuste pontual (postponements) anterior é descartado
    // pela mesma razão de save(): a âncora antiga não faz mais sentido.
    const nextDraft = { startDate: draft.proposedStartDate, dailyWorkloadHours: existing.dailyWorkloadHours, weekdays: existing.weekdays, postponements: undefined }
    const schedule = computeSchedule(nextDraft, course)

    const conflict = findScheduleConflict(
      {
        id: existing.id,
        teacherId: existing.teacherId,
        roomId: existing.roomId,
        startDate: draft.proposedStartDate,
        endDate: schedule.endDate,
        weekdays: existing.weekdays,
        timeSlot: existing.timeSlot,
      },
      classGroups.value,
    )

    if (conflict) {
      return { ok: false, conflict }
    }

    if (existing.roomId) {
      const roomsStore = useRoomsStore()
      const capacityConflict = findCapacityConflict(existing.expectedStudents, roomsStore.getById(existing.roomId))
      if (capacityConflict) {
        return { ok: false, capacityConflict }
      }
    }

    Object.assign(existing, {
      startDate: draft.proposedStartDate,
      postponements: undefined,
      computedEndDate: schedule.endDate,
      computedMonthlyBreakdown: schedule.monthlyBreakdown,
      computedClassDates: schedule.classDates,
      updatedAt: new Date().toISOString(),
    })

    return { ok: true, classGroup: existing }
  }

  /**
   * Adia (por arraste no calendário) a partir de uma aula específica —
   * ex: professor faltou uma semana. A aula em `draggedFromDate` (no
   * cronograma atual) e todas as seguintes deslocam para frente o mesmo
   * número de dias corridos até `draggedToDate`; aulas anteriores nunca
   * mudam, e `startDate` da turma não é alterada. Só aceita adiar para
   * uma data POSTERIOR à original — soltar em data igual ou anterior
   * retorna `ok: false` sem `conflict`/`capacityConflict` (a UI deve
   * tratar como arraste inválido, sem exibir os modais de conflito).
   * Conflito de horário/capacidade bloqueia o salvamento, como em `save()`.
   */
  function postpone(id: string, draggedFromDate: string, draggedToDate: string): RescheduleResult {
    const existing = classGroups.value.find((c) => c.id === id)
    if (!existing) return { ok: false }

    const draft = computePostponeDraft({ draggedFromDate, draggedToDate })
    if (!draft.ok) return { ok: false }

    const coursesStore = useCoursesStore()
    const course = coursesStore.getById(existing.courseId)
    if (!course) return { ok: false }

    const nextPostponements = [...(existing.postponements ?? []), { fromDate: draggedFromDate, shiftDays: draft.shiftDays }]
    const nextDraft = {
      startDate: existing.startDate,
      dailyWorkloadHours: existing.dailyWorkloadHours,
      weekdays: existing.weekdays,
      postponements: nextPostponements,
    }
    const schedule = computeSchedule(nextDraft, course)

    const conflict = findScheduleConflict(
      {
        id: existing.id,
        teacherId: existing.teacherId,
        roomId: existing.roomId,
        startDate: existing.startDate,
        endDate: schedule.endDate,
        weekdays: existing.weekdays,
        timeSlot: existing.timeSlot,
      },
      classGroups.value,
    )

    if (conflict) {
      return { ok: false, conflict }
    }

    if (existing.roomId) {
      const roomsStore = useRoomsStore()
      const capacityConflict = findCapacityConflict(existing.expectedStudents, roomsStore.getById(existing.roomId))
      if (capacityConflict) {
        return { ok: false, capacityConflict }
      }
    }

    Object.assign(existing, {
      postponements: nextPostponements,
      computedEndDate: schedule.endDate,
      computedMonthlyBreakdown: schedule.monthlyBreakdown,
      computedClassDates: schedule.classDates,
      updatedAt: new Date().toISOString(),
    })

    return { ok: true, classGroup: existing }
  }

  function remove(id: string): void {
    classGroups.value = classGroups.value.filter((c) => c.id !== id)
  }

  function getById(id: string): ClassGroup | undefined {
    return classGroups.value.find((c) => c.id === id)
  }

  function getByTeacherId(teacherId: string): ClassGroup[] {
    return classGroups.value.filter((c) => c.teacherId === teacherId)
  }

  function getByRoomId(roomId: string): ClassGroup[] {
    return classGroups.value.filter((c) => c.roomId === roomId)
  }

  function replaceAll(newClassGroups: ClassGroup[]): void {
    classGroups.value = newClassGroups
  }

  return { classGroups, computeSchedule, save, reschedule, postpone, remove, getById, getByTeacherId, getByRoomId, replaceAll }
})
