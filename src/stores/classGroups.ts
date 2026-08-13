import { defineStore } from "pinia"
import { ref } from "vue"
import type { ClassGroup } from "../types"
import { LOCAL_STORAGE_KEYS, persistToLocalStorage, readFromLocalStorage } from "../composables/useLocalStorage"
import { calculateSchedule } from "../services/calendarEngine"
import { findCapacityConflict, findScheduleConflict, type CapacityConflict, type ScheduleConflict } from "../services/conflictChecker"
import { useHolidaysStore } from "./holidays"
import { useRoomsStore } from "./rooms"
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
  function computeSchedule(draft: Pick<ClassGroupDraft, "startDate" | "dailyWorkloadHours" | "weekdays">, course: { totalWorkloadHours: number }) {
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
    })
  }

  /**
   * Salva (cria ou atualiza) uma turma, recalculando o calendário e
   * verificando, antes de persistir: (1) conflito de horário do
   * professor OU do espaço físico, e (2) se o número de alunos
   * previstos excede a capacidade do espaço. Se qualquer um ocorrer,
   * NÃO salva (regra de negócio 3, estendida a espaços físicos).
   */
  function save(draft: ClassGroupDraft, course: { totalWorkloadHours: number }, existingId?: string): SaveClassGroupResult {
    const schedule = computeSchedule(draft, course)

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
        computedEndDate: schedule.endDate,
        computedMonthlyBreakdown: schedule.monthlyBreakdown,
        computedClassDates: schedule.classDates,
        updatedAt: now,
      })
      return { ok: true, classGroup: existing }
    }

    const classGroup: ClassGroup = {
      ...draft,
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

  return { classGroups, computeSchedule, save, remove, getById, getByTeacherId, getByRoomId, replaceAll }
})
