import type { ClassGroup, TimeSlot, Weekday } from "../types"

export interface ScheduleConflictCheckInput {
  /** Turma sendo criada/editada (id pode ser omitido/novo se ainda não existir). */
  id?: string
  teacherId: string
  startDate: string
  /** Data de término calculada pelo calendarEngine para a turma em avaliação. */
  endDate: string | null
  weekdays: Weekday[]
  timeSlot: Pick<TimeSlot, "start" | "end">
}

export interface ScheduleConflict {
  conflictingClassGroup: ClassGroup
  sharedWeekdays: Weekday[]
}

function timeRangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  // Comparação de strings "HH:mm" funciona lexicograficamente como comparação de horário.
  return aStart < bEnd && bStart < aEnd
}

function dateRangesOverlap(aStart: string, aEnd: string | null, bStart: string, bEnd: string | null): boolean {
  // Turma sem data de término calculada (ex: dados inconsistentes) é tratada como
  // "sem fim conhecido" para não deixar passar um conflito por baixo do radar.
  const aEndSafe = aEnd ?? "9999-12-31"
  const bEndSafe = bEnd ?? "9999-12-31"
  return aStart <= bEndSafe && bStart <= aEndSafe
}

/**
 * Verifica se a turma informada colide de horário com alguma turma já
 * existente do mesmo professor (regra de negócio 3): mesmo professor,
 * períodos de vigência que se sobrepõem, pelo menos um dia da semana em
 * comum e faixas de horário que se sobrepõem.
 *
 * Retorna a primeira turma conflitante encontrada, ou null se não houver conflito.
 * Turmas canceladas são ignoradas na checagem.
 */
export function findScheduleConflict(
  candidate: ScheduleConflictCheckInput,
  existingClassGroups: ClassGroup[],
): ScheduleConflict | null {
  for (const other of existingClassGroups) {
    if (other.id === candidate.id) continue
    if (other.teacherId !== candidate.teacherId) continue
    if (other.status === "cancelled") continue

    if (!dateRangesOverlap(candidate.startDate, candidate.endDate, other.startDate, other.computedEndDate)) {
      continue
    }

    const sharedWeekdays = candidate.weekdays.filter((d) => other.weekdays.includes(d))
    if (sharedWeekdays.length === 0) continue

    if (!timeRangesOverlap(candidate.timeSlot.start, candidate.timeSlot.end, other.timeSlot.start, other.timeSlot.end)) {
      continue
    }

    return { conflictingClassGroup: other, sharedWeekdays }
  }

  return null
}
