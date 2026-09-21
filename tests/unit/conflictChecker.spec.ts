import { describe, expect, it } from "vitest"
import { findCapacityConflict, findScheduleConflict } from "../../src/services/conflictChecker"
import type { ClassGroup, Room } from "../../src/types"

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

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "room-1",
    name: "Sala 1",
    capacity: 30,
    active: true,
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
    expect(conflict?.kind).toBe("teacher")
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

  it("detecta conflito de SALA: mesmo espaço, professores diferentes, horário sobreposto", () => {
    const existing = [makeClassGroup({ teacherId: "teacher-1", roomId: "room-1" })]
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-2",
        roomId: "room-1",
        startDate: "2026-02-15",
        endDate: "2026-05-01",
        weekdays: [1],
        timeSlot: { start: "09:00", end: "13:00" },
      },
      existing,
    )

    expect(conflict).not.toBeNull()
    expect(conflict?.kind).toBe("room")
    expect(conflict?.conflictingClassGroup.id).toBe("cg-existing")
  })

  it("não detecta conflito de sala quando os espaços são diferentes", () => {
    const existing = [makeClassGroup({ teacherId: "teacher-1", roomId: "room-1" })]
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-2",
        roomId: "room-2",
        startDate: "2026-02-15",
        endDate: "2026-05-01",
        weekdays: [1, 3, 5],
        timeSlot: { start: "08:00", end: "12:00" },
      },
      existing,
    )

    expect(conflict).toBeNull()
  })

  it("não detecta conflito de sala quando nenhuma das turmas tem espaço definido", () => {
    const existing = [makeClassGroup({ teacherId: "teacher-1", roomId: undefined })]
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-2",
        roomId: undefined,
        startDate: "2026-02-15",
        endDate: "2026-05-01",
        weekdays: [1, 3, 5],
        timeSlot: { start: "08:00", end: "12:00" },
      },
      existing,
    )

    expect(conflict).toBeNull()
  })

  it("prioriza o conflito de professor quando professor E sala colidem ao mesmo tempo", () => {
    const existing = [makeClassGroup({ teacherId: "teacher-1", roomId: "room-1" })]
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-1",
        roomId: "room-1",
        startDate: "2026-02-15",
        endDate: "2026-05-01",
        weekdays: [1],
        timeSlot: { start: "09:00", end: "13:00" },
      },
      existing,
    )

    expect(conflict?.kind).toBe("teacher")
  })
})

describe("conflictChecker.findScheduleConflict — turmas de Aprendizagem (comparação por datas reais)", () => {
  // Turma de Aprendizagem: vigência longa (prática até junho), mas só ocupa professor/sala nas datas de teoria.
  const apprenticeship = makeClassGroup({
    id: "cg-aprendizagem",
    startDate: "2026-03-02",
    computedEndDate: "2026-06-30",
    weekdays: [4, 5],
    computedClassDates: ["2026-03-02", "2026-03-03", "2026-03-19", "2026-03-20"],
    computedPracticeDates: ["2026-03-16", "2026-03-17"],
  })

  it("detecta conflito quando a turma comum cai numa data de teoria da Aprendizagem, mesmo fora dos dias da semana da turma", () => {
    // 02/03 é segunda: a Aprendizagem tem teoria nos 10 dias iniciais, embora seus dias de teoria "normais" sejam qui/sex.
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-1",
        startDate: "2026-03-02",
        endDate: "2026-03-30",
        weekdays: [1],
        timeSlot: { start: "08:00", end: "12:00" },
        classDates: ["2026-03-02", "2026-03-09"],
      },
      [apprenticeship],
    )

    expect(conflict?.kind).toBe("teacher")
    expect(conflict?.sharedWeekdays).toEqual([1])
  })

  it("não detecta conflito em dia de PRÁTICA (na empresa), que não ocupa professor nem sala", () => {
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-1",
        roomId: "room-1",
        startDate: "2026-03-16",
        endDate: "2026-03-17",
        weekdays: [1, 2],
        timeSlot: { start: "08:00", end: "12:00" },
        classDates: ["2026-03-16", "2026-03-17"],
      },
      [{ ...apprenticeship, roomId: "room-1" }],
    )

    expect(conflict).toBeNull()
  })

  it("não detecta conflito quando os horários não se sobrepõem, mesmo com datas em comum", () => {
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-1",
        startDate: "2026-03-02",
        endDate: "2026-03-03",
        weekdays: [1, 2],
        timeSlot: { start: "13:00", end: "17:00" },
        classDates: ["2026-03-02", "2026-03-03"],
      },
      [apprenticeship],
    )

    expect(conflict).toBeNull()
  })

  it("quando a turma em avaliação é de Aprendizagem, compara as datas dela com as de uma turma comum", () => {
    const standard = makeClassGroup({
      id: "cg-comum",
      startDate: "2026-03-01",
      computedEndDate: "2026-07-01",
      weekdays: [1],
      computedClassDates: ["2026-03-02", "2026-03-09", "2026-03-16"],
    })

    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-1",
        startDate: "2026-03-02",
        endDate: "2026-06-30",
        weekdays: [4, 5],
        timeSlot: { start: "08:00", end: "12:00" },
        classDates: ["2026-03-02", "2026-03-03"],
        apprenticeship: true,
      },
      [standard],
    )
    expect(conflict?.conflictingClassGroup.id).toBe("cg-comum")

    // Sem nenhuma data em comum (só a turma comum às segundas de 09 e 16), não há conflito.
    const none = findScheduleConflict(
      {
        teacherId: "teacher-1",
        startDate: "2026-03-03",
        endDate: "2026-06-30",
        weekdays: [4, 5],
        timeSlot: { start: "08:00", end: "12:00" },
        classDates: ["2026-03-03", "2026-03-19"],
        apprenticeship: true,
      },
      [standard],
    )
    expect(none).toBeNull()
  })

  it("turmas comuns continuam sendo comparadas por vigência + dias da semana (comportamento anterior)", () => {
    const standard = makeClassGroup({ weekdays: [1], computedClassDates: ["2026-02-02"] })
    const conflict = findScheduleConflict(
      {
        teacherId: "teacher-1",
        startDate: "2026-02-15",
        endDate: "2026-05-01",
        weekdays: [1],
        timeSlot: { start: "08:00", end: "12:00" },
        classDates: ["2026-02-16"], // datas informadas, mas nenhuma das turmas é de Aprendizagem
      },
      [standard],
    )

    expect(conflict?.kind).toBe("teacher")
  })
})

describe("conflictChecker.findCapacityConflict", () => {
  it("detecta quando o número de alunos previstos excede a capacidade do espaço", () => {
    const room = makeRoom({ capacity: 25 })
    const conflict = findCapacityConflict(30, room)

    expect(conflict).not.toBeNull()
    expect(conflict?.room.id).toBe(room.id)
    expect(conflict?.expectedStudents).toBe(30)
  })

  it("não detecta conflito quando o número de alunos é igual à capacidade", () => {
    const room = makeRoom({ capacity: 25 })
    expect(findCapacityConflict(25, room)).toBeNull()
  })

  it("não detecta conflito quando o número de alunos é menor que a capacidade", () => {
    const room = makeRoom({ capacity: 25 })
    expect(findCapacityConflict(10, room)).toBeNull()
  })

  it("retorna null quando nenhum espaço foi selecionado", () => {
    expect(findCapacityConflict(50, undefined)).toBeNull()
  })

  it("retorna null quando o número de alunos não foi informado", () => {
    const room = makeRoom({ capacity: 25 })
    expect(findCapacityConflict(undefined, room)).toBeNull()
  })
})
