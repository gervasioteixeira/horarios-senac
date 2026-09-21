import { describe, expect, it } from "vitest"
import type { CourseUnit } from "../../src/types"
import { computeClassGroupUnitSchedule, computeUnitSchedule, sumUnitsWorkload } from "../../src/services/unitSchedule"

function unit(id: string, workloadHours: number, kind: CourseUnit["kind"] = "theory"): CourseUnit {
  return { id, name: `UC ${id}`, workloadHours, kind }
}

/** 10 aulas em dias consecutivos fictícios, uma por dia. */
const DATES = Array.from({ length: 10 }, (_, i) => `2026-03-${String(i + 2).padStart(2, "0")}`)

describe("unitSchedule.sumUnitsWorkload", () => {
  it("soma a carga horária das UCs", () => {
    expect(sumUnitsWorkload([unit("a", 60), unit("b", 20), unit("c", 24)])).toBe(104)
  })

  it("ignora UCs com carga inválida (zero/negativa) e lista vazia dá zero", () => {
    expect(sumUnitsWorkload([unit("a", 10), unit("b", 0), unit("c", -5)])).toBe(10)
    expect(sumUnitsWorkload([])).toBe(0)
  })

  it("não acumula erro de ponto flutuante", () => {
    expect(sumUnitsWorkload([unit("a", 0.1), unit("b", 0.2)])).toBe(0.3)
  })
})

describe("unitSchedule.computeUnitSchedule", () => {
  it("distribui UCs múltiplas da carga diária em datas consecutivas sem sobreposição", () => {
    // carga diária 4h: UC A = 8h (2 aulas), UC B = 12h (3 aulas), UC C = 4h (1 aula)
    const result = computeUnitSchedule(DATES, 4, [unit("A", 8), unit("B", 12), unit("C", 4)])
    expect(result.map((r) => [r.startDate, r.endDate])).toEqual([
      ["2026-03-02", "2026-03-03"],
      ["2026-03-04", "2026-03-06"],
      ["2026-03-07", "2026-03-07"],
    ])
  })

  it("quando a UC termina no meio de uma aula, a mesma data é o fim de uma UC e o início da seguinte", () => {
    // carga diária 4h: A = 6h (aula 1 inteira + metade da aula 2), B = 6h (metade da aula 2 + aula 3)
    const result = computeUnitSchedule(DATES, 4, [unit("A", 6), unit("B", 6)])
    expect(result[0]).toMatchObject({ startDate: "2026-03-02", endDate: "2026-03-03" })
    expect(result[1]).toMatchObject({ startDate: "2026-03-03", endDate: "2026-03-04" })
  })

  it("respeita a ordem em que as UCs foram informadas", () => {
    const result = computeUnitSchedule(DATES, 4, [unit("B", 12), unit("A", 8)])
    expect(result[0].unit.id).toBe("B")
    expect(result[0].startDate).toBe("2026-03-02")
    expect(result[1].startDate).toBe("2026-03-05")
  })

  it("UC sem carga horária fica sem datas e não consome aulas", () => {
    const result = computeUnitSchedule(DATES, 4, [unit("A", 0), unit("B", 4)])
    expect(result[0]).toMatchObject({ startDate: null, endDate: null })
    expect(result[1]).toMatchObject({ startDate: "2026-03-02", endDate: "2026-03-02" })
  })

  it("UC além do último dia do cronograma fica sem datas; a que cruza o limite termina na última aula", () => {
    const result = computeUnitSchedule(DATES.slice(0, 2), 4, [unit("A", 4), unit("B", 12), unit("C", 4)])
    expect(result[0]).toMatchObject({ startDate: "2026-03-02", endDate: "2026-03-02" })
    expect(result[1]).toMatchObject({ startDate: "2026-03-03", endDate: "2026-03-03" })
    expect(result[2]).toMatchObject({ startDate: null, endDate: null })
  })

  it("funciona com carga diária fracionada sem erro de ponto flutuante", () => {
    // 1.5h/dia: A = 3h (aulas 1-2), B = 1.5h (aula 3)
    const result = computeUnitSchedule(DATES, 1.5, [unit("A", 3), unit("B", 1.5)])
    expect(result[0]).toMatchObject({ startDate: "2026-03-02", endDate: "2026-03-03" })
    expect(result[1]).toMatchObject({ startDate: "2026-03-04", endDate: "2026-03-04" })
  })

  it("carga diária inválida ou lista vazia não quebra", () => {
    expect(computeUnitSchedule(DATES, 0, [unit("A", 4)])[0]).toMatchObject({ startDate: null, endDate: null })
    expect(computeUnitSchedule(DATES, 4, [])).toEqual([])
    expect(computeUnitSchedule([], 4, [unit("A", 4)])[0]).toMatchObject({ startDate: null, endDate: null })
  })
})

describe("unitSchedule.computeClassGroupUnitSchedule", () => {
  const THEORY_DATES = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05"]
  const PRACTICE_DATES = ["2026-03-16", "2026-03-17", "2026-03-18"]

  it("em turma comum, todas as UCs seguem em sequência sobre as aulas", () => {
    const result = computeClassGroupUnitSchedule(
      { classDates: THEORY_DATES, dailyWorkloadHours: 4 },
      [unit("A", 8), unit("B", 8)],
    )
    expect(result.map((r) => [r.startDate, r.endDate])).toEqual([
      ["2026-03-02", "2026-03-03"],
      ["2026-03-04", "2026-03-05"],
    ])
  })

  it("em turma de Aprendizagem, UCs de teoria correm sobre as datas de teoria e as de prática sobre as de prática", () => {
    const units = [unit("T1", 8, "theory"), unit("P1", 12, "practice"), unit("T2", 8, "theory"), unit("P2", 6, "practice")]
    const result = computeClassGroupUnitSchedule(
      { classDates: THEORY_DATES, dailyWorkloadHours: 4, practiceDates: PRACTICE_DATES, practiceDailyHours: 6 },
      units,
    )

    // Mantém a ordem original das UCs.
    expect(result.map((r) => r.unit.id)).toEqual(["T1", "P1", "T2", "P2"])
    // Teoria: T1 = 2 aulas, T2 = 2 aulas seguintes.
    expect([result[0].startDate, result[0].endDate]).toEqual(["2026-03-02", "2026-03-03"])
    expect([result[2].startDate, result[2].endDate]).toEqual(["2026-03-04", "2026-03-05"])
    // Prática (6h/dia): P1 = 12h = 2 dias, P2 = 6h = 1 dia.
    expect([result[1].startDate, result[1].endDate]).toEqual(["2026-03-16", "2026-03-17"])
    expect([result[3].startDate, result[3].endDate]).toEqual(["2026-03-18", "2026-03-18"])
  })
})
