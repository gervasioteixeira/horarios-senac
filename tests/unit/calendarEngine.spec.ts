import { describe, expect, it } from "vitest"
import { calculateSchedule } from "../../src/services/calendarEngine"

function sumHours(breakdown: { hoursCount: number }[]): number {
  return breakdown.reduce((sum, b) => sum + b.hoursCount, 0)
}

describe("calendarEngine.calculateSchedule", () => {
  it("calcula corretamente um caso simples sem feriados (seg/qua/sex, 4h/dia, 40h)", () => {
    // 2026-01-05 é uma segunda-feira.
    const result = calculateSchedule({
      startDate: "2026-01-05",
      totalWorkloadHours: 40,
      dailyWorkloadHours: 4,
      weekdays: [1, 3, 5],
      holidayDates: new Set(),
    })

    // 40h / 4h por dia = 10 aulas necessárias.
    expect(result.classDates).toHaveLength(10)
    expect(sumHours(result.monthlyBreakdown)).toBe(40)
    // Confere que nenhuma data cai fora de seg/qua/sex.
    for (const iso of result.classDates) {
      const day = new Date(iso + "T00:00:00Z").getUTCDay()
      expect([1, 3, 5]).toContain(day)
    }
  })

  it("pula um feriado no meio do período e desloca a data de término", () => {
    const withoutHoliday = calculateSchedule({
      startDate: "2026-01-05",
      totalWorkloadHours: 40,
      dailyWorkloadHours: 4,
      weekdays: [1, 3, 5],
      holidayDates: new Set(),
    })

    // Descobre a segunda data de aula do cenário sem feriado e a declara feriado.
    const secondClassDate = withoutHoliday.classDates[1]

    const withHoliday = calculateSchedule({
      startDate: "2026-01-05",
      totalWorkloadHours: 40,
      dailyWorkloadHours: 4,
      weekdays: [1, 3, 5],
      holidayDates: new Set([secondClassDate]),
    })

    expect(withHoliday.classDates).not.toContain(secondClassDate)
    expect(withHoliday.classDates).toHaveLength(10)
    // Como um dia foi pulado, a data de término desloca para depois.
    expect(withHoliday.endDate! > withoutHoliday.endDate!).toBe(true)
  })

  it("nunca agenda aula aos domingos, mesmo que domingo seja passado por engano em weekdays", () => {
    const result = calculateSchedule({
      startDate: "2026-01-04", // domingo
      totalWorkloadHours: 8,
      dailyWorkloadHours: 4,
      // @ts-expect-error -- testando proteção contra entrada inválida (domingo = 0)
      weekdays: [0, 1],
      holidayDates: new Set(),
    })

    for (const iso of result.classDates) {
      const day = new Date(iso + "T00:00:00Z").getUTCDay()
      expect(day).not.toBe(0)
    }
  })

  it("atravessa virada de mês e de ano corretamente na distribuição mensal", () => {
    // 2025-12-29 é uma segunda-feira; força a turma a atravessar dez/2025 -> jan/2026.
    const result = calculateSchedule({
      startDate: "2025-12-29",
      totalWorkloadHours: 24,
      dailyWorkloadHours: 4,
      weekdays: [1, 2, 3, 4, 5],
      holidayDates: new Set(),
    })

    const months = result.monthlyBreakdown.map((b) => `${b.year}-${b.month}`)
    expect(months).toContain("2025-12")
    expect(months).toContain("2026-1")
    expect(sumHours(result.monthlyBreakdown)).toBe(24)
  })

  it("a soma de horas do monthlyBreakdown sempre bate com o total de aulas × carga diária", () => {
    const result = calculateSchedule({
      startDate: "2026-02-02",
      totalWorkloadHours: 160,
      dailyWorkloadHours: 4,
      weekdays: [2, 4],
      holidayDates: new Set(),
    })

    expect(sumHours(result.monthlyBreakdown)).toBe(result.classDates.length * 4)
  })

  it("retorna resultado vazio quando weekdays está vazio, sem entrar em loop infinito", () => {
    const result = calculateSchedule({
      startDate: "2026-01-05",
      totalWorkloadHours: 40,
      dailyWorkloadHours: 4,
      weekdays: [],
      holidayDates: new Set(),
    })

    expect(result.endDate).toBeNull()
    expect(result.classDates).toHaveLength(0)
  })

  describe("postponements (adiamento pontual, ex: falta do professor)", () => {
    it("desloca a aula em fromDate e todas as seguintes, mantendo as anteriores intactas", () => {
      const base = calculateSchedule({
        startDate: "2026-01-05", // segunda
        totalWorkloadHours: 40,
        dailyWorkloadHours: 4,
        weekdays: [1, 3, 5],
        holidayDates: new Set(),
      })

      // Adia a partir da 5ª aula em 7 dias corridos (uma semana de falta).
      const anchorDate = base.classDates[4]
      const adjusted = calculateSchedule({
        startDate: "2026-01-05",
        totalWorkloadHours: 40,
        dailyWorkloadHours: 4,
        weekdays: [1, 3, 5],
        holidayDates: new Set(),
        postponements: [{ fromDate: anchorDate, shiftDays: 7 }],
      })

      // Aulas anteriores permanecem idênticas.
      expect(adjusted.classDates.slice(0, 4)).toEqual(base.classDates.slice(0, 4))
      // Mesmo número de aulas (carga horária total preservada).
      expect(adjusted.classDates).toHaveLength(base.classDates.length)
      // A partir da aula ajustada, todas as datas são posteriores ao cronograma original.
      for (let i = 4; i < adjusted.classDates.length; i++) {
        expect(adjusted.classDates[i] > base.classDates[i]).toBe(true)
      }
      // Continua respeitando os dias da semana da turma.
      for (const iso of adjusted.classDates) {
        const day = new Date(iso + "T00:00:00Z").getUTCDay()
        expect([1, 3, 5]).toContain(day)
      }
      // Data de término desloca para depois.
      expect(adjusted.endDate! > base.endDate!).toBe(true)
    })

    it("aplica múltiplos postponements em cascata, em ordem cronológica", () => {
      const base = calculateSchedule({
        startDate: "2026-01-05",
        totalWorkloadHours: 40,
        dailyWorkloadHours: 4,
        weekdays: [1, 3, 5],
        holidayDates: new Set(),
      })

      const secondAnchor = base.classDates[2]
      const fifthAnchor = base.classDates[5]

      const adjusted = calculateSchedule({
        startDate: "2026-01-05",
        totalWorkloadHours: 40,
        dailyWorkloadHours: 4,
        weekdays: [1, 3, 5],
        holidayDates: new Set(),
        // Fora de ordem de propósito — a função deve ordenar internamente por fromDate.
        postponements: [
          { fromDate: fifthAnchor, shiftDays: 3 },
          { fromDate: secondAnchor, shiftDays: 7 },
        ],
      })

      expect(adjusted.classDates.slice(0, 2)).toEqual(base.classDates.slice(0, 2))
      expect(adjusted.classDates).toHaveLength(base.classDates.length)
    })
  })
})
