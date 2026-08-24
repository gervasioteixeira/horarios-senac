import { describe, expect, it } from "vitest"
import { computeRescheduleDraft, diffInDays, shiftIsoDate } from "../../src/services/rescheduler"

describe("rescheduler.diffInDays", () => {
  it("calcula diferença positiva entre datas", () => {
    expect(diffInDays("2026-02-01", "2026-02-05")).toBe(4)
  })

  it("calcula diferença negativa entre datas", () => {
    expect(diffInDays("2026-02-05", "2026-02-01")).toBe(-4)
  })

  it("retorna zero para datas iguais", () => {
    expect(diffInDays("2026-02-05", "2026-02-05")).toBe(0)
  })

  it("calcula diferença corretamente através de virada de mês", () => {
    expect(diffInDays("2026-01-30", "2026-02-02")).toBe(3)
  })
})

describe("rescheduler.shiftIsoDate", () => {
  it("desloca data para frente", () => {
    expect(shiftIsoDate("2026-02-01", 5)).toBe("2026-02-06")
  })

  it("desloca data para trás", () => {
    expect(shiftIsoDate("2026-02-05", -5)).toBe("2026-01-31")
  })
})

describe("rescheduler.computeRescheduleDraft", () => {
  it("adiar a turma (arrastar aula para uma data posterior) não exige confirmação", () => {
    const result = computeRescheduleDraft({
      currentStartDate: "2026-02-02",
      draggedFromDate: "2026-02-02",
      draggedToDate: "2026-02-09",
    })
    expect(result.deltaDays).toBe(7)
    expect(result.proposedStartDate).toBe("2026-02-09")
    expect(result.requiresAdvanceConfirmation).toBe(false)
  })

  it("arrastar uma aula posterior (não a primeira) desloca a startDate pelo mesmo delta", () => {
    const result = computeRescheduleDraft({
      currentStartDate: "2026-02-02",
      draggedFromDate: "2026-02-16", // uma aula no meio da turma
      draggedToDate: "2026-02-18",
    })
    expect(result.deltaDays).toBe(2)
    expect(result.proposedStartDate).toBe("2026-02-04")
    expect(result.requiresAdvanceConfirmation).toBe(false)
  })

  it("antecipar a primeira aula para antes do início definido exige confirmação", () => {
    const result = computeRescheduleDraft({
      currentStartDate: "2026-02-02",
      draggedFromDate: "2026-02-02",
      draggedToDate: "2026-01-26",
    })
    expect(result.deltaDays).toBe(-7)
    expect(result.proposedStartDate).toBe("2026-01-26")
    expect(result.requiresAdvanceConfirmation).toBe(true)
  })

  it("soltar no mesmo dia (nenhum deslocamento) não exige confirmação nem altera nada", () => {
    const result = computeRescheduleDraft({
      currentStartDate: "2026-02-02",
      draggedFromDate: "2026-02-02",
      draggedToDate: "2026-02-02",
    })
    expect(result.deltaDays).toBe(0)
    expect(result.proposedStartDate).toBe("2026-02-02")
    expect(result.requiresAdvanceConfirmation).toBe(false)
  })
})
