import { describe, expect, it } from "vitest"
import {
  APPRENTICESHIP_INITIAL_SEQUENCE_DAYS,
  calculateApprenticeshipSchedule,
  type CalculateApprenticeshipScheduleParams,
} from "../../src/services/apprenticeshipEngine"

/** Curso pequeno: teoria 80h (20 dias de 4h) e prática 60h (10 dias de 6h). */
function params(overrides: Partial<CalculateApprenticeshipScheduleParams> = {}): CalculateApprenticeshipScheduleParams {
  return {
    startDate: "2026-03-02", // segunda-feira
    theoryTotalHours: 80,
    practiceTotalHours: 60,
    theoryDailyHours: 4,
    practiceDailyHours: 6,
    theoryWeekdays: [4, 5], // quinta e sexta
    holidayDates: new Set(),
    recesses: [],
    ...overrides,
  }
}

describe("apprenticeshipEngine.calculateApprenticeshipSchedule", () => {
  it("a regra dos 10 dias iniciais é de 10 dias úteis", () => {
    expect(APPRENTICESHIP_INITIAL_SEQUENCE_DAYS).toBe(10)
  })

  it("os 10 primeiros dias úteis são só de teoria, seguidos, e depois cada dia segue o dia da semana", () => {
    const result = calculateApprenticeshipSchedule(params())

    expect(result.classDates.slice(0, 10)).toEqual([
      "2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06",
      "2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13",
    ])
    // Depois: qui/sex teoria, seg/ter/qua prática.
    expect(result.classDates.slice(10, 14)).toEqual(["2026-03-19", "2026-03-20", "2026-03-26", "2026-03-27"])
    expect(result.practiceDates.slice(0, 6)).toEqual([
      "2026-03-16", "2026-03-17", "2026-03-18", "2026-03-23", "2026-03-24", "2026-03-25",
    ])
  })

  it("cumpre exatamente as cargas: teoria e prática, e termina quando ambas acabam", () => {
    const result = calculateApprenticeshipSchedule(params())

    expect(result.classDates).toHaveLength(20) // 80h / 4h
    expect(result.practiceDates).toHaveLength(10) // 60h / 6h
    expect(result.endDate).toBe("2026-04-10")
  })

  it("quando a prática termina, a semana toda vira teoria (o inverso)", () => {
    const result = calculateApprenticeshipSchedule(params())

    // Prática acaba na segunda 06/04; de terça a sexta (07-10/04) a teoria ocupa a semana toda.
    expect(result.practiceDates[result.practiceDates.length - 1]).toBe("2026-04-06")
    expect(result.classDates.slice(-4)).toEqual(["2026-04-07", "2026-04-08", "2026-04-09", "2026-04-10"])
  })

  it("quando a teoria termina, a semana toda vira prática", () => {
    // Só 40h de teoria: acabam nos 10 dias iniciais. Prática de 60h passa a ocupar seg-sex.
    const result = calculateApprenticeshipSchedule(params({ theoryTotalHours: 40 }))

    expect(result.classDates).toHaveLength(10)
    expect(result.practiceDates).toEqual([
      "2026-03-16", "2026-03-17", "2026-03-18", "2026-03-19", "2026-03-20",
      "2026-03-23", "2026-03-24", "2026-03-25", "2026-03-26", "2026-03-27",
    ])
    expect(result.endDate).toBe("2026-03-27")
  })

  it("exemplo do cliente: teoria seg/sex, prática ter/qua/qui — dia 11 numa quarta é prática", () => {
    // Começando numa quarta, os 10 dias úteis terminam na terça; o dia 11 é quarta.
    const result = calculateApprenticeshipSchedule(params({ startDate: "2026-03-04", theoryWeekdays: [1, 5] }))

    expect(result.classDates[9]).toBe("2026-03-17") // terça
    expect(result.practiceDates[0]).toBe("2026-03-18") // quarta = prática
  })

  it("exemplo do cliente: teoria seg/sex — dia 11 numa sexta é teoria", () => {
    // Começando numa sexta, os 10 dias úteis terminam na quinta; o dia 11 é sexta.
    const result = calculateApprenticeshipSchedule(params({ startDate: "2026-03-06", theoryWeekdays: [1, 5] }))

    expect(result.classDates[9]).toBe("2026-03-19") // quinta
    expect(result.classDates[10]).toBe("2026-03-20") // sexta = teoria
  })

  it("exemplo do cliente: começando numa quinta, os 10 dias terminam na quarta e a quinta já é prática", () => {
    const result = calculateApprenticeshipSchedule(params({ startDate: "2026-03-05", theoryWeekdays: [1, 5] }))

    expect(result.classDates[9]).toBe("2026-03-18") // quarta
    expect(result.practiceDates[0]).toBe("2026-03-19") // quinta
  })

  it("feriado não conta como dia útil dos 10 iniciais nem tem prática", () => {
    const result = calculateApprenticeshipSchedule(params({ holidayDates: new Set(["2026-03-04"]) }))

    expect(result.classDates).not.toContain("2026-03-04")
    expect(result.classDates[9]).toBe("2026-03-16") // o 10º dia útil escorrega para a segunda seguinte
    expect(result.practiceDates).not.toContain("2026-03-04")
  })

  it("feriado numa segunda de prática pula o dia sem ser reposto como prática nesse dia", () => {
    const result = calculateApprenticeshipSchedule(params({ holidayDates: new Set(["2026-03-16"]) }))

    expect(result.practiceDates).not.toContain("2026-03-16")
    expect(result.practiceDates[0]).toBe("2026-03-17")
  })

  it("em recesso não há teoria: a semana toda (seg-sex) vira prática", () => {
    // Recesso na semana 16-20/03, em que qui/sex seriam teoria.
    const result = calculateApprenticeshipSchedule(
      params({ recesses: [{ startDate: "2026-03-16", endDate: "2026-03-20" }] }),
    )

    expect(result.practiceDates.slice(0, 5)).toEqual([
      "2026-03-16", "2026-03-17", "2026-03-18", "2026-03-19", "2026-03-20",
    ])
    expect(result.classDates.some((d) => d >= "2026-03-16" && d <= "2026-03-20")).toBe(false)
  })

  it("em recesso, se a prática já acabou, não há nenhuma atividade", () => {
    const result = calculateApprenticeshipSchedule(
      params({ practiceTotalHours: 6, recesses: [{ startDate: "2026-03-17", endDate: "2026-03-20" }] }),
    )

    // Prática de 1 dia (segunda 16/03); depois só teoria, mas recesso de 17 a 20/03 não tem aula.
    expect(result.practiceDates).toEqual(["2026-03-16"])
    expect(result.classDates.some((d) => d >= "2026-03-17" && d <= "2026-03-20")).toBe(false)
    expect(result.classDates[10]).toBe("2026-03-23")
  })

  it("sábado só tem teoria, e só quando é um dos dias de teoria da turma", () => {
    const withSaturday = calculateApprenticeshipSchedule(params({ theoryWeekdays: [6] }))
    const withoutSaturday = calculateApprenticeshipSchedule(params({ theoryWeekdays: [4] }))

    const isSaturday = (iso: string) => new Date(iso + "T00:00:00Z").getUTCDay() === 6
    expect(withSaturday.classDates.some(isSaturday)).toBe(true)
    expect(withSaturday.practiceDates.some(isSaturday)).toBe(false)
    expect(withoutSaturday.classDates.some(isSaturday)).toBe(false)
    expect(withoutSaturday.practiceDates.some(isSaturday)).toBe(false)
  })

  it("domingo nunca tem atividade", () => {
    const result = calculateApprenticeshipSchedule(params({ startDate: "2026-03-01" })) // domingo
    const isSunday = (iso: string) => new Date(iso + "T00:00:00Z").getUTCDay() === 0

    expect(result.classDates[0]).toBe("2026-03-02")
    expect([...result.classDates, ...result.practiceDates].some(isSunday)).toBe(false)
  })

  it("distribui teoria e prática por mês", () => {
    const result = calculateApprenticeshipSchedule(params())

    expect(result.monthlyBreakdown).toEqual([
      { year: 2026, month: 3, classesCount: 14, hoursCount: 56, practiceClassesCount: 8, practiceHoursCount: 48 },
      { year: 2026, month: 4, classesCount: 6, hoursCount: 24, practiceClassesCount: 2, practiceHoursCount: 12 },
    ])
  })

  it("adiamento a partir de uma data empurra o restante sem mexer no que veio antes", () => {
    const base = calculateApprenticeshipSchedule(params())
    const postponed = calculateApprenticeshipSchedule(
      params({ postponements: [{ fromDate: "2026-03-16", shiftDays: 7 }] }),
    )

    // Os 10 dias iniciais (antes de 16/03) ficam iguais.
    expect(postponed.classDates.slice(0, 10)).toEqual(base.classDates.slice(0, 10))
    expect(postponed.practiceDates[0]).toBe("2026-03-23")
    expect(postponed.endDate).toBe("2026-04-17")
  })

  it("carga horária não inteira em horas não acumula erro de ponto flutuante", () => {
    // 12h a 1,2h/dia são exatamente 10 dias (em float puro, subtrações sucessivas de 1,2 deixam resíduo e gerariam um 11º dia).
    const result = calculateApprenticeshipSchedule(
      params({ theoryTotalHours: 12, theoryDailyHours: 1.2, practiceTotalHours: 6, practiceDailyHours: 6 }),
    )
    expect(result.classDates).toHaveLength(10)
  })

  it("parâmetros inválidos retornam resultado vazio", () => {
    const empty = { endDate: null, monthlyBreakdown: [], classDates: [], practiceDates: [] }
    expect(calculateApprenticeshipSchedule(params({ theoryWeekdays: [] }))).toEqual(empty)
    expect(calculateApprenticeshipSchedule(params({ theoryTotalHours: 0 }))).toEqual(empty)
    expect(calculateApprenticeshipSchedule(params({ practiceTotalHours: 0 }))).toEqual(empty)
    expect(calculateApprenticeshipSchedule(params({ theoryDailyHours: 0 }))).toEqual(empty)
    expect(calculateApprenticeshipSchedule(params({ practiceDailyHours: 0 }))).toEqual(empty)
  })
})
