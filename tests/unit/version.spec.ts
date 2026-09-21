import { describe, expect, it } from "vitest"
import { APP_BUILD, formatBuildDate, formatVersionDetails, formatVersionLabel } from "../../src/constants/version"

describe("version", () => {
  it("as constantes de build são injetadas", () => {
    expect(APP_BUILD.version).toMatch(/^\d+\.\d+\.\d+/)
    expect(Number.isNaN(new Date(APP_BUILD.builtAt).getTime())).toBe(false)
  })

  it("formata a data no fuso de Brasília, independente do fuso da máquina", () => {
    // 21:05 UTC = 18:05 em Brasília (UTC-3).
    expect(formatBuildDate("2026-09-21T21:05:00.000Z")).toBe("21/09/2026 18:05")
    // Virada de dia: 01:30 UTC ainda é o dia anterior em Brasília.
    expect(formatBuildDate("2026-01-01T01:30:00.000Z")).toBe("31/12/2025 22:30")
  })

  it("data inválida vira texto vazio, sem quebrar", () => {
    expect(formatBuildDate("não é data")).toBe("")
  })

  it("rótulo curto traz versão e data", () => {
    expect(formatVersionLabel({ version: "1.1.0", commit: "2b4f3ff", builtAt: "2026-09-21T21:05:00.000Z" })).toBe(
      "Versão 1.1.0 · 21/09/2026 18:05",
    )
  })

  it("rótulo sem data válida mostra só a versão", () => {
    expect(formatVersionLabel({ version: "1.1.0", commit: "", builtAt: "" })).toBe("Versão 1.1.0")
  })

  it("detalhes incluem o commit quando disponível e omitem quando não", () => {
    const withCommit = formatVersionDetails({ version: "1.1.0", commit: "2b4f3ff", builtAt: "2026-09-21T21:05:00.000Z" })
    expect(withCommit).toContain("Compilação: 2b4f3ff")
    expect(withCommit).toContain("Publicada em: 21/09/2026 18:05")

    expect(formatVersionDetails({ version: "1.1.0", commit: "", builtAt: "2026-09-21T21:05:00.000Z" })).not.toContain("Compilação")
  })
})
