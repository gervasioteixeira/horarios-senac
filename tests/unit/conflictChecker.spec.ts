import { describe, expect, it } from "vitest"
import { findScheduleConflict } from "../../src/services/conflictChecker"
import type { ClassGroup } from "../../src/types"

function makeClassGroup(overrides: Partial<ClassGroup>): ClassGroup {
  return {
    id: "cg-existing",
    courseId: "course-1",
    teacherId: "teacher-1",
    name: "Turma existente",
    startDate: "2026-02-01",
    dailyWorkloadHours: 4,
    weekdays: [1, 3, 5],
    timeSlot: { period: "morning", start: "08:00", end: "12:00" },
    status: "planned",
    computedEndDate: "2026-04-01",
    computedMonthlyBreakdown: [],
    computedClassDates: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("conflictChecker.findScheduleConflict", () => {
  it("detecta conflito: mesmo professor, mesmo dia, horários sobrepostos", () => {
    const existing = [makeClassGroup({})]
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-1",
        startDate: "2026-02-15",
        endDate: "2026-05-01",
        weekdays: [1],
        timeSlot: { start: "09:00", end: "13:00" },
      },
      existing,
    )

    expect(conflict).not.toBeNull()
    expect(conflict?.conflictingClassGroup.id).toBe("cg-existing")
    expect(conflict?.sharedWeekdays).toContain(1)
  })

  it("não detecta conflito quando os dias da semana são diferentes", () => {
    const existing = [makeClassGroup({ weekdays: [2, 4] })]
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-1",
        startDate: "2026-02-15",
        endDate: "2026-05-01",
        weekdays: [1, 3, 5],
        timeSlot: { start: "08:00", end: "12:00" },
      },
      existing,
    )

    expect(conflict).toBeNull()
  })

  it("não detecta conflito quando os horários são adjacentes sem sobreposição", () => {
    const existing = [makeClassGroup({ timeSlot: { period: "morning", start: "08:00", end: "12:00" } })]
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-1",
        startDate: "2026-02-15",
        endDate: "2026-05-01",
        weekdays: [1, 3, 5],
        timeSlot: { start: "13:00", end: "17:00" },
      },
      existing,
    )

    expect(conflict).toBeNull()
  })

  it("não detecta conflito quando as vigências não se cruzam", () => {
    const existing = [makeClassGroup({ startDate: "2026-01-01", computedEndDate: "2026-02-01" })]
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-1",
        startDate: "2026-03-01",
        endDate: "2026-05-01",
        weekdays: [1, 3, 5],
        timeSlot: { start: "08:00", end: "12:00" },
      },
      existing,
    )

    expect(conflict).toBeNull()
  })

  it("não detecta conflito entre professores diferentes, mesmo com horário idêntico", () => {
    const existing = [makeClassGroup({ teacherId: "teacher-2" })]
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-1",
        startDate: "2026-02-15",
        endDate: "2026-05-01",
        weekdays: [1, 3, 5],
        timeSlot: { start: "08:00", end: "12:00" },
      },
      existing,
    )

    expect(conflict).toBeNull()
  })

  it("ignora turmas canceladas na checagem de conflito", () => {
    const existing = [makeClassGroup({ status: "cancelled" })]
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-1",
        startDate: "2026-02-15",
        endDate: "2026-05-01",
        weekdays: [1, 3, 5],
        timeSlot: { start: "08:00", end: "12:00" },
      },
      existing,
    )

    expect(conflict).toBeNull()
  })

  it("ignora a própria turma ao editar (mesmo id não gera conflito consigo mesma)", () => {
    const existing = [makeClassGroup({ id: "cg-self" })]
    const conflict = findScheduleConflict(
      {
        id: "cg-self",
        teacherId: "teacher-1",
        startDate: "2026-02-01",
        endDate: "2026-04-01",
        weekdays: [1, 3, 5],
        timeSlot: { start: "08:00", end: "12:00" },
      },
      existing,
    )

    expect(conflict).toBeNull()
  })
})
