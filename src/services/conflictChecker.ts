import type { ClassGroup, Room, TimeSlot, Weekday } from "../types"

export interface ScheduleConflictCheckInput {
  /** Turma sendo criada/editada (id pode ser omitido/novo se ainda não existir). */
  id?: string
  teacherId: string
  /** Espaço físico onde a turma acontece. Se omitido, não há checagem de conflito de sala. */
  roomId?: string
  startDate: string
  /** Data de término calculada pelo calendarEngine para a turma em avaliação. */
  endDate: string | null
  weekdays: Weekday[]
  timeSlot: Pick<TimeSlot, "start" | "end">
  /**
   * Datas em que a turma em avaliação ocupa professor/espaço (`computedClassDates`).
   * Usada no lugar de "vigência + dias da semana" quando a turma em avaliação OU a
   * comparada é de Aprendizagem — nelas, o intervalo início-fim e os dias da semana
   * não descrevem quando há teoria (ver apprenticeshipEngine.ts).
   */
  classDates?: string[]
  /** true se a turma em avaliação é de Aprendizagem. */
  apprenticeship?: boolean
}

export type ScheduleConflictKind = "teacher" | "room"

export interface ScheduleConflict {
  kind: ScheduleConflictKind
  conflictingClassGroup: ClassGroup
  sharedWeekdays: Weekday[]
}

export interface CapacityConflict {
  room: Room
  expectedStudents: number
}

function timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  // Comparação de strings "HH:mm" funciona lexicograficamente como comparação de horário.
  return aStart < bEnd && bStart < aEnd
}

function weekdayOfIso(iso: string): Weekday {
  return new Date(iso + "T00:00:00Z").getUTCDay() as Weekday
}

function dateRangesOverlap(aStart: string, aEnd: string | null, bStart: string, bEnd: string | null): boolean {
  // Turma sem data de término calculada (ex: dados inconsistentes) é tratada como
  // "sem fim conhecido" para não deixar passar um conflito por baixo do radar.
  const aEndSafe = aEnd ?? "9999-12-31"
  const bEndSafe = bEnd ?? "9999-12-31"
  return aStart <= bEndSafe && bStart <= aEndSafe
}

function findConflictBySameResource(
  candidate: ScheduleConflictCheckInput,
  existingClassGroups: ClassGroup[],
  kind: ScheduleConflictKind,
  resourceIdOf: (cg: ClassGroup | ScheduleConflictCheckInput) => string | undefined,
): ScheduleConflict | null {
  const candidateResourceId = resourceIdOf(candidate)
  if (!candidateResourceId) return null

  for (const other of existingClassGroups) {
    if (other.id === candidate.id) continue
    if (other.status === "cancelled") continue
    if (resourceIdOf(other) !== candidateResourceId) continue

    const otherIsApprenticeship = other.computedPracticeDates !== undefined
    const compareByDates =
      candidate.classDates !== undefined &&
      (candidate.apprenticeship || otherIsApprenticeship) &&
      other.computedClassDates.length > 0

    let sharedWeekdays: Weekday[]
    if (compareByDates) {
      const otherDates = new Set(other.computedClassDates)
      const sharedDates = candidate.classDates!.filter((d) => otherDates.has(d))
      if (sharedDates.length === 0) continue
      sharedWeekdays = Array.from(new Set(sharedDates.map(weekdayOfIso))).sort((a, b) => a - b)
    } else {
      if (!dateRangesOverlap(candidate.startDate, candidate.endDate, other.startDate, other.computedEndDate)) {
        continue
      }
      sharedWeekdays = candidate.weekdays.filter((d) => other.weekdays.includes(d))
      if (sharedWeekdays.length === 0) continue
    }

    if (!timeRangesOverlap(candidate.timeSlot.start, candidate.timeSlot.end, other.timeSlot.start, other.timeSlot.end)) {
      continue
    }

    return { kind, conflictingClassGroup: other, sharedWeekdays }
  }

  return null
}

/**
 * Verifica se a turma informada colide de horário com alguma turma já
 * existente (regra de negócio 3, estendida): mesmo professor OU mesmo
 * espaço físico, períodos de vigência que se sobrepõem, pelo menos um
 * dia da semana em comum e faixas de horário que se sobrepõem.
 *
 * A checagem de professor tem prioridade sobre a de sala quando ambas
 * ocorrem — retorna o primeiro conflito encontrado. Turmas canceladas
 * são ignoradas.
 */
export function findScheduleConflict(
  candidate: ScheduleConflictCheckInput,
  existingClassGroups: ClassGroup[],
): ScheduleConflict | null {
  const teacherConflict = findConflictBySameResource(candidate, existingClassGroups, "teacher", (cg) => cg.teacherId)
  if (teacherConflict) return teacherConflict

  return findConflictBySameResource(candidate, existingClassGroups, "room", (cg) => cg.roomId)
}

/**
 * Verifica se o número de alunos previstos da turma excede a
 * capacidade do espaço escolhido. Retorna null se não houver espaço
 * selecionado, número de alunos informado, ou se a capacidade for
 * suficiente.
 */
export function findCapacityConflict(expectedStudents: number | undefined, room: Room | undefined): CapacityConflict | null {
  if (!room || !expectedStudents) return null
  if (expectedStudents <= room.capacity) return null
  return { room, expectedStudents }
}
