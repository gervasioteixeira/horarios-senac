import type { ClassPostponement, MonthlyBreakdownEntry, Weekday } from "../types"
import { formatIsoDate, parseIsoDate, type CalculateScheduleResult } from "./calendarEngine"

/** Quantos dias úteis seguidos, só de teoria, abrem toda turma de Aprendizagem. */
export const APPRENTICESHIP_INITIAL_SEQUENCE_DAYS = 10

export interface RecessRange {
  /** Primeiro dia do recesso, "YYYY-MM-DD". */
  startDate: string
  /** Último dia do recesso (inclusive), "YYYY-MM-DD". */
  endDate: string
}

export interface CalculateApprenticeshipScheduleParams {
  /** Data de início no formato "YYYY-MM-DD". */
  startDate: string
  /** Carga horária total da teoria (soma das UCs teóricas), em horas. */
  theoryTotalHours: number
  /** Carga horária total da prática (soma das UCs práticas), em horas. */
  practiceTotalHours: number
  /** Horas cursadas por dia de teoria. */
  theoryDailyHours: number
  /** Horas cursadas por dia de prática. */
  practiceDailyHours: number
  /** Dias da semana de TEORIA (1=segunda ... 6=sábado). A prática ocupa os demais dias úteis (seg-sex). */
  theoryWeekdays: Weekday[]
  /** Feriados ("YYYY-MM-DD"): nesses dias não há nem teoria nem prática. */
  holidayDates: Set<string>
  /** Recessos escolares: nesses períodos não há teoria; a semana toda (seg-sex) vira prática. */
  recesses: RecessRange[]
  /** Ajustes pontuais de calendário (ver ClassPostponement), aplicados como em calendarEngine. */
  postponements?: ClassPostponement[]
  /** Dias iniciais só de teoria. Padrão: APPRENTICESHIP_INITIAL_SEQUENCE_DAYS. */
  initialSequenceDays?: number
}

export interface CalculateApprenticeshipScheduleResult extends CalculateScheduleResult {
  /** Datas de prática (na empresa), em ordem cronológica. `classDates` traz só as de teoria. */
  practiceDates: string[]
}

/** Limite de segurança contra loop infinito, como em calendarEngine. */
const MAX_ITERATIONS = 20000

type DayKind = "theory" | "practice" | null

/**
 * Motor de calendário para cursos de Aprendizagem Profissional, em que
 * teoria (no SENAC) e prática (na empresa) correm em paralelo:
 *
 * 1. Os primeiros `initialSequenceDays` (10) dias úteis, seg-sex e sem contar
 *    feriados, são SÓ de teoria, em sequência (40h a 4h/dia = 10% da teoria).
 * 2. A partir daí, "volta ao normal": dias da semana da turma (`theoryWeekdays`)
 *    são de teoria; os demais dias úteis (seg-sex) são de prática.
 * 3. Em recesso, não há teoria: a semana toda (seg-sex) vira prática.
 * 4. Quando a carga da teoria termina, a semana toda (seg-sex) vira prática.
 *    Inversamente, quando a prática termina, a semana toda vira teoria (exceto
 *    em recesso, em que nada acontece).
 * 5. Domingos e feriados nunca têm atividade. Sábado só tem teoria, e só se for
 *    um dos dias de teoria da turma.
 *
 * O curso termina quando teoria e prática estão cumpridas. As horas são
 * contadas em centésimos para não acumular erro de ponto flutuante.
 */
export function calculateApprenticeshipSchedule(
  params: CalculateApprenticeshipScheduleParams,
): CalculateApprenticeshipScheduleResult {
  const empty: CalculateApprenticeshipScheduleResult = { endDate: null, monthlyBreakdown: [], classDates: [], practiceDates: [] }
  const { startDate, theoryWeekdays, holidayDates, recesses, postponements } = params

  const scale = (hours: number) => Math.round(hours * 100)
  const theoryTotal = scale(params.theoryTotalHours)
  const practiceTotal = scale(params.practiceTotalHours)
  const theoryDaily = scale(params.theoryDailyHours)
  const practiceDaily = scale(params.practiceDailyHours)

  if (theoryTotal <= 0 || practiceTotal <= 0 || theoryDaily <= 0 || practiceDaily <= 0 || theoryWeekdays.length === 0) {
    return empty
  }

  const theoryDaySet = new Set<number>(theoryWeekdays)
  const pendingPostponements = [...(postponements ?? [])].sort((a, b) => a.fromDate.localeCompare(b.fromDate))

  const theoryDates: string[] = []
  const practiceDates: string[] = []
  const breakdownMap = new Map<string, MonthlyBreakdownEntry>()

  let theoryLeft = theoryTotal
  let practiceLeft = practiceTotal
  let initialLeft = params.initialSequenceDays ?? APPRENTICESHIP_INITIAL_SEQUENCE_DAYS

  function classifyDay(iso: string, dayOfWeek: number): DayKind {
    if (dayOfWeek === 0 || holidayDates.has(iso)) return null

    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5
    const inRecess = recesses.some((r) => iso >= r.startDate && iso <= r.endDate)

    if (initialLeft > 0 && theoryLeft > 0 && !inRecess) return isWeekday ? "theory" : null

    if (theoryLeft > 0 && practiceLeft > 0) {
      if (inRecess) return isWeekday ? "practice" : null
      if (theoryDaySet.has(dayOfWeek)) return "theory"
      return isWeekday ? "practice" : null
    }
    if (theoryLeft <= 0) return isWeekday ? "practice" : null
    // Só falta teoria (a prática já foi cumprida): a semana toda vira teoria, exceto em recesso.
    if (inRecess) return null
    return isWeekday || theoryDaySet.has(dayOfWeek) ? "theory" : null
  }

  const cursor = parseIsoDate(startDate)
  let iterations = 0

  while ((theoryLeft > 0 || practiceLeft > 0) && iterations < MAX_ITERATIONS) {
    iterations++

    while (pendingPostponements.length > 0 && formatIsoDate(cursor) >= pendingPostponements[0].fromDate) {
      cursor.setUTCDate(cursor.getUTCDate() + pendingPostponements.shift()!.shiftDays)
    }

    const iso = formatIsoDate(cursor)
    const kind = classifyDay(iso, cursor.getUTCDay())

    if (kind !== null) {
      const year = cursor.getUTCFullYear()
      const month = cursor.getUTCMonth() + 1
      const key = `${year}-${month}`
      let entry = breakdownMap.get(key)
      if (!entry) {
        entry = { year, month, classesCount: 0, hoursCount: 0, practiceClassesCount: 0, practiceHoursCount: 0 }
        breakdownMap.set(key, entry)
      }

      if (kind === "theory") {
        theoryLeft -= theoryDaily
        if (initialLeft > 0) initialLeft--
        theoryDates.push(iso)
        entry.classesCount += 1
        entry.hoursCount += params.theoryDailyHours
      } else {
        practiceLeft -= practiceDaily
        practiceDates.push(iso)
        entry.practiceClassesCount = (entry.practiceClassesCount ?? 0) + 1
        entry.practiceHoursCount = (entry.practiceHoursCount ?? 0) + params.practiceDailyHours
      }
    }

    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  const lastTheory = theoryDates[theoryDates.length - 1]
  const lastPractice = practiceDates[practiceDates.length - 1]
  const endDate = [lastTheory, lastPractice].filter(Boolean).sort().pop() ?? null

  const monthlyBreakdown = Array.from(breakdownMap.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month,
  )

  return { endDate, monthlyBreakdown, classDates: theoryDates, practiceDates }
}
