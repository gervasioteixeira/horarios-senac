import { describe, expect, it } from "vitest"
import { buildBackupPayload, InvalidBackupFileError, parseBackupFile, serializeBackup } from "../../src/services/backup"
import type { BackupSourceData } from "../../src/services/backup"

function emptyData(): BackupSourceData {
  return { teachers: [], courses: [], holidays: [], classGroups: [] }
}

describe("backup service", () => {
  it("gera um JSON de export contendo todas as entidades", () => {
    const data: BackupSourceData = {
      teachers: [
        {
          id: "t1",
          name: "Ana",
          colorHex: "#ff0000",
          active: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      courses: [],
      holidays: [],
      classGroups: [],
    }

    const payload = buildBackupPayload(data)
    const json = serializeBackup(payload)
    const parsedBack = JSON.parse(json)

    expect(parsedBack.schemaVersion).toBe(1)
    expect(parsedBack.data.teachers).toHaveLength(1)
    expect(parsedBack.data.teachers[0].name).toBe("Ana")
    expect(parsedBack.data.courses).toEqual([])
    expect(parsedBack.data.holidays).toEqual([])
    expect(parsedBack.data.classGroups).toEqual([])
  })

  it("faz o roundtrip export -> import sem perda de dados", () => {
    const data: BackupSourceData = {
      ...emptyData(),
      courses: [
        {
          id: "c1",
          name: "Excel Básico",
          totalWorkloadHours: 40,
          active: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    }
    const payload = buildBackupPayload(data)
    const json = serializeBackup(payload)

    const imported = parseBackupFile(json)

    expect(imported.data.courses).toHaveLength(1)
    expect(imported.data.courses[0].name).toBe("Excel Básico")
  })

  it("rejeita um JSON malformado (sintaxe inválida) sem lançar erro cru", () => {
    expect(() => parseBackupFile("{ isso não é json")).toThrow(InvalidBackupFileError)
  })

  it("rejeita um JSON válido mas que não é um backup reconhecível", () => {
    expect(() => parseBackupFile(JSON.stringify({ foo: "bar" }))).toThrow(InvalidBackupFileError)
  })

  it("rejeita um backup com data incompleta (faltando uma das listas)", () => {
    const broken = JSON.stringify({
      schemaVersion: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      data: { teachers: [], courses: [], holidays: [] }, // falta classGroups
    })
    expect(() => parseBackupFile(broken)).toThrow(InvalidBackupFileError)
  })

  it("rejeita um backup de uma versão de esquema mais nova que a suportada", () => {
    const future = JSON.stringify({
      schemaVersion: 999,
      exportedAt: "2026-01-01T00:00:00.000Z",
      data: emptyData(),
    })
    expect(() => parseBackupFile(future)).toThrow(InvalidBackupFileError)
  })
})
