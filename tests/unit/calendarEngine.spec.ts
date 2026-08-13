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
})
