import { describe, expect, it } from "vitest"
import { endDateDelayDays } from "../../src/services/endDateForecast"

describe("endDateForecast.endDateDelayDays", () => {
  it("retorna a diferença em dias corridos quando a previsão foi empurrada", () => {
    expect(endDateDelayDays({ originalEndDate: "2026-03-11", computedEndDate: "2026-03-18" })).toBe(7)
  })

  it("atravessa virada de mês e de ano", () => {
    expect(endDateDelayDays({ originalEndDate: "2026-12-28", computedEndDate: "2027-01-04" })).toBe(7)
  })

  it("retorna 0 quando a previsão não mudou", () => {
    expect(endDateDelayDays({ originalEndDate: "2026-03-11", computedEndDate: "2026-03-11" })).toBe(0)
  })

  it("retorna 0 para turma antiga sem originalEndDate", () => {
    expect(endDateDelayDays({ computedEndDate: "2026-03-11" })).toBe(0)
  })

  it("retorna 0 quando alguma das datas é desconhecida", () => {
    expect(endDateDelayDays({ originalEndDate: null, computedEndDate: "2026-03-11" })).toBe(0)
    expect(endDateDelayDays({ originalEndDate: "2026-03-11", computedEndDate: null })).toBe(0)
  })

  it("nunca retorna atraso negativo", () => {
    expect(endDateDelayDays({ originalEndDate: "2026-03-18", computedEndDate: "2026-03-11" })).toBe(0)
  })
})
