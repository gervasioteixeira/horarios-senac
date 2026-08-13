import { describe, expect, it } from "vitest"
import {
  calculateEasterDate,
  generateNationalHolidaysForYear,
  mergeHolidayDates,
} from "../../src/services/holidayEngine"
import type { Holiday } from "../../src/types"

describe("holidayEngine", () => {
  it("calcula a data da Páscoa corretamente para anos conhecidos", () => {
    // Valores de referência conhecidos publicamente.
    expect(calculateEasterDate(2024)).toEqual({ month: 3, day: 31 })
    expect(calculateEasterDate(2025)).toEqual({ month: 4, day: 20 })
    expect(calculateEasterDate(2026)).toEqual({ month: 4, day: 5 })
  })

  it("inclui todos os feriados nacionais fixos do ano", () => {
    const holidays = generateNationalHolidaysForYear(2026)
    const dates = holidays.map((h) => h.date)

    expect(dates).toContain("2026-01-01") // Confraternização Universal
    expect(dates).toContain("2026-04-21") // Tiradentes
    expect(dates).toContain("2026-05-01") // Dia do Trabalho
    expect(dates).toContain("2026-09-07") // Independência
    expect(dates).toContain("2026-10-12") // N. Sra. Aparecida
    expect(dates).toContain("2026-11-02") // Finados
    expect(dates).toContain("2026-11-15") // Proclamação da República
    expect(dates).toContain("2026-12-25") // Natal
  })

  it("calcula corretamente os feriados móveis a partir da Páscoa de 2026 (05/04)", () => {
    const holidays = generateNationalHolidaysForYear(2026)
    const byName = Object.fromEntries(holidays.map((h) => [h.name, h.date]))

    expect(byName["Páscoa"]).toBe("2026-04-05")
    expect(byName["Sexta-feira Santa"]).toBe("2026-04-03") // Páscoa - 2 dias
    expect(byName["Carnaval"]).toBe("2026-02-17") // Páscoa - 47 dias
    expect(byName["Corpus Christi"]).toBe("2026-06-04") // Páscoa + 60 dias
  })

  it("mescla feriados nacionais com feriados customizados em um único conjunto de datas", () => {
    const national = generateNationalHolidaysForYear(2026)
    const custom: Holiday[] = [
      { id: "custom-1", date: "2026-06-24", name: "Aniversário da cidade", scope: "municipal", recurring: false },
    ]

    const merged = mergeHolidayDates(national, custom)

    expect(merged.has("2026-01-01")).toBe(true)
    expect(merged.has("2026-06-24")).toBe(true)
    expect(merged.has("2026-06-25")).toBe(false)
  })
})
