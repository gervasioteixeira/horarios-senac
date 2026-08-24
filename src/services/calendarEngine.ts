import type { ClassPostponement, MonthlyBreakdownEntry, Weekday } from "../types"

export interface CalculateScheduleParams {
  /** Data de início no formato "YYYY-MM-DD". */
  startDate: string
  /** Carga horária total do curso, em horas. */
  totalWorkloadHours: number
  /** Carga horária cursada por dia de aula, em horas. */
  dailyWorkloadHours: number
  /** Dias da semana em que a turma tem aula (1=segunda ... 6=sábado). Nunca inclui domingo. */
  weekdays: Weekday[]
  /** Conjunto de datas de feriado ("YYYY-MM-DD") a serem puladas. */
  holidayDates: Set<string>
  /**
   * Ajustes pontuais de calendário (ver ClassPostponement) aplicados,
   * em ordem, durante a geração: ao alcançar a `fromDate` de um ajuste
   * (comparada à data corrente do cronograma "puro", sem ajustes
   * anteriores já consumidos), soma `shiftDays` ao cursor antes de
   * continuar procurando o próximo dia letivo válido. Datas anteriores
   * a `fromDate` nunca são afetadas.
   */
  postponements?: ClassPostponement[]
}

export interface CalculateScheduleResult {
  /** Data do último dia de aula, formato "YYYY-MM-DD". null se não houver nenhum dia válido. */
  endDate: string | null
  /** Distribuição de aulas/horas por mês, ordenada cronologicamente. */
  monthlyBreakdown: MonthlyBreakdownEntry[]
  /** Todas as datas de aula, em ordem cronológica, formato "YYYY-MM-DD". */
  classDates: string[]
}

/** Limite de segurança para evitar loop infinito caso os parâmetros sejam inválidos (ex: weekdays vazio). */
const MAX_ITERATIONS = 20000

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Motor de calendário: calcula a data de término de uma turma e a
 * distribuição de aulas/horas por mês, a partir da data de início,
 * carga horária total, carga horária diária, dias da semana letivos
 * e feriados cadastrados.
 *
 * Regras de iteração (regra de negócio 1):
 * - Pula domingos sempre.
 * - Pula dias da semana não selecionados para a turma.
 * - Pula datas presentes na lista de feriados.
 * - Acumula a carga horária diária em cada dia válido até atingir o total.
 */
export function calculateSchedule(params: CalculateScheduleParams): CalculateScheduleResult {
  const { startDate, totalWorkloadHours, dailyWorkloadHours, weekdays, holidayDates, postponements } = params

  if (totalWorkloadHours <= 0 || dailyWorkloadHours <= 0 || weekdays.length === 0) {
    return { endDate: null, monthlyBreakdown: [], classDates: [] }
  }

  const weekdaySet = new Set<number>(weekdays)
  const classDates: string[] = []
  const breakdownMap = new Map<string, MonthlyBreakdownEntry>()

  // Ajustes pendentes, em ordem cronológica de fromDate; cada um é consumido
  // (removido da fila) na primeira vez que o cursor o alcança ou ultrapassa.
  const pendingPostponements = [...(postponements ?? [])].sort((a, b) => a.fromDate.localeCompare(b.fromDate))

  let cursor = parseIsoDate(startDate)
  let accumulatedHours = 0
  let iterations = 0

  while (accumulatedHours < totalWorkloadHours && iterations < MAX_ITERATIONS) {
    iterations++

    while (pendingPostponements.length > 0 && formatIsoDate(cursor) >= pendingPostponements[0].fromDate) {
      const next = pendingPostponements.shift()!
      cursor.setUTCDate(cursor.getUTCDate() + next.shiftDays)
    }

    const isoDate = formatIsoDate(cursor)
    const dayOfWeek = cursor.getUTCDay() // 0=domingo ... 6=sábado

    const isSunday = dayOfWeek === 0
    const isSelectedWeekday = weekdaySet.has(dayOfWeek)
    const isHoliday = holidayDates.has(isoDate)

    if (!isSunday && isSelectedWeekday && !isHoliday) {
      // Não deixa a última aula "estourar" a carga horária total além do necessário
      // para simplificar: cada dia de aula conta a carga diária inteira, mesmo que
      // ultrapasse levemente o total (comportamento esperado: nº de aulas é sempre
      // um número inteiro de dias letivos).
      accumulatedHours += dailyWorkloadHours
      classDates.push(isoDate)

      const year = cursor.getUTCFullYear()
      const month = cursor.getUTCMonth() + 1
      const key = `${year}-${month}`
      const entry = breakdownMap.get(key)
      if (entry) {
        entry.classesCount += 1
        entry.hoursCount += dailyWorkloadHours
      } else {
        breakdownMap.set(key, { year, month, classesCount: 1, hoursCount: dailyWorkloadHours })
      }
    }

    cursor = new Date(cursor)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  const monthlyBreakdown = Array.from(breakdownMap.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month,
  )

  return {
    endDate: classDates.length > 0 ? classDates[classDates.length - 1] : null,
    monthlyBreakdown,
    classDates,
  }
}
