import { beforeEach, describe, expect, it } from "vitest"
import { createPinia, setActivePinia } from "pinia"
import { useClassGroupsStore, type ClassGroupDraft } from "../../src/stores/classGroups"
import { useCoursesStore } from "../../src/stores/courses"
import { useHolidaysStore } from "../../src/stores/holidays"
import { endDateDelayDays } from "../../src/services/endDateForecast"
import type { Course } from "../../src/types"

/** Segundas e quartas, 4h por aula. Com um curso de 16h → 4 aulas: 02/03, 04/03, 09/03, 11/03 de 2026. */
function draft(courseId: string, overrides: Partial<ClassGroupDraft> = {}): ClassGroupDraft {
  return {
    courseId,
    teacherId: "teacher-1",
    name: "Turma Teste",
    startDate: "2026-03-02",
    dailyWorkloadHours: 4,
    weekdays: [1, 3],
    timeSlot: { period: "morning", start: "07:00", end: "12:00" },
    status: "planned",
    ...overrides,
  }
}

beforeEach(() => {
  window.localStorage.clear()
  setActivePinia(createPinia())
})

describe("classGroups store — previsão de encerramento original", () => {
  let course: Course
  let store: ReturnType<typeof useClassGroupsStore>

  beforeEach(() => {
    course = useCoursesStore().create({ name: "Curso", totalWorkloadHours: 16, active: true })
    store = useClassGroupsStore()
  })

  function saveTurma(overrides: Partial<ClassGroupDraft> = {}) {
    const result = store.save(draft(course.id, overrides), course)
    expect(result.ok).toBe(true)
    return result.classGroup!
  }

  it("ao criar a turma, a previsão original é igual à calculada e não há atraso", () => {
    const cg = saveTurma()
    expect(cg.computedEndDate).toBe("2026-03-11")
    expect(cg.originalEndDate).toBe("2026-03-11")
    expect(endDateDelayDays(cg)).toBe(0)
  })

  it("adiar a partir de uma aula empurra a previsão calculada mas preserva a original", () => {
    const cg = saveTurma()

    const result = store.postpone(cg.id, "2026-03-09", "2026-03-16")

    expect(result.ok).toBe(true)
    expect(result.classGroup?.computedEndDate).toBe("2026-03-18")
    expect(result.classGroup?.originalEndDate).toBe("2026-03-11")
    expect(endDateDelayDays(result.classGroup!)).toBe(7)
  })

  it("adiamentos sucessivos acumulam o atraso sobre a mesma previsão original", () => {
    const cg = saveTurma()
    store.postpone(cg.id, "2026-03-09", "2026-03-16")
    const result = store.postpone(cg.id, "2026-03-16", "2026-03-23")

    expect(result.classGroup?.originalEndDate).toBe("2026-03-11")
    expect(endDateDelayDays(result.classGroup!)).toBe(14)
  })

  it("turma antiga sem originalEndDate ganha a referência a partir da previsão que tinha antes do adiamento", () => {
    const cg = saveTurma()
    delete cg.originalEndDate

    const result = store.postpone(cg.id, "2026-03-09", "2026-03-16")

    expect(result.classGroup?.originalEndDate).toBe("2026-03-11")
    expect(endDateDelayDays(result.classGroup!)).toBe(7)
  })

  it("editar a turma pelo formulário redefine a previsão original (zera o atraso)", () => {
    const cg = saveTurma()
    store.postpone(cg.id, "2026-03-09", "2026-03-16")

    const edited = store.save(draft(course.id), course, cg.id)

    expect(edited.classGroup?.computedEndDate).toBe("2026-03-11")
    expect(edited.classGroup?.originalEndDate).toBe("2026-03-11")
    expect(endDateDelayDays(edited.classGroup!)).toBe(0)
  })

  it("mover a turma inteira redefine a previsão original para a nova previsão", () => {
    const cg = saveTurma()
    store.postpone(cg.id, "2026-03-09", "2026-03-16")

    // Arrasta a primeira aula 7 dias para frente: a turma toda começa em 09/03.
    const result = store.reschedule(cg.id, "2026-03-02", "2026-03-09")

    expect(result.ok).toBe(true)
    expect(result.classGroup?.computedEndDate).toBe("2026-03-18")
    expect(result.classGroup?.originalEndDate).toBe("2026-03-18")
    expect(endDateDelayDays(result.classGroup!)).toBe(0)
  })

  it("turma de curso comum não tem datas de prática", () => {
    expect(saveTurma().computedPracticeDates).toBeUndefined()
  })
})

describe("classGroups store — cursos de Aprendizagem", () => {
  let store: ReturnType<typeof useClassGroupsStore>

  /** Teoria de `theory`h e prática de `practice`h, em UCs únicas. */
  function apprenticeshipCourse(theory: number, practice: number): Course {
    return useCoursesStore().create({
      name: "Aprendizagem",
      totalWorkloadHours: theory + practice,
      isApprenticeship: true,
      units: [
        { id: "u-theory", name: "Teoria", workloadHours: theory, kind: "theory" },
        { id: "u-practice", name: "Prática", workloadHours: practice, kind: "practice" },
      ],
      active: true,
    })
  }

  function apprenticeshipDraft(course: Course, overrides: Partial<ClassGroupDraft> = {}): ClassGroupDraft {
    return draft(course.id, { weekdays: [4, 5], practiceDailyHours: 6, ...overrides })
  }

  beforeEach(() => {
    store = useClassGroupsStore()
  })

  it("usa o motor de Aprendizagem: 10 dias úteis de teoria e depois a prática, com datas separadas", () => {
    // 40h de teoria = exatamente os 10 dias iniciais; 12h de prática = 2 dias de 6h, que passam a ocupar seg-sex.
    const course = apprenticeshipCourse(40, 12)

    const result = store.save(apprenticeshipDraft(course), course)

    expect(result.ok).toBe(true)
    const cg = result.classGroup!
    expect(cg.computedClassDates).toHaveLength(10)
    expect(cg.computedClassDates[0]).toBe("2026-03-02")
    expect(cg.computedClassDates[9]).toBe("2026-03-13")
    expect(cg.computedPracticeDates).toEqual(["2026-03-16", "2026-03-17"])
    expect(cg.computedEndDate).toBe("2026-03-17")
    expect(cg.practiceDailyHours).toBe(6)
  })

  it("sem a carga diária de prática, cai no cálculo comum em vez de quebrar", () => {
    const course = apprenticeshipCourse(40, 12)

    const cg = store.save(apprenticeshipDraft(course, { practiceDailyHours: undefined }), course).classGroup!

    expect(cg.computedPracticeDates).toBeUndefined()
    expect(cg.computedEndDate).not.toBeNull()
  })

  it("recesso cadastrado tira a teoria do período e empurra o encerramento", () => {
    // 48h de teoria (12 dias) e 12h de prática (2 dias). Sem recesso: prática em 16-17/03, teoria termina 19/03.
    const course = apprenticeshipCourse(48, 12)
    const without = store.save(apprenticeshipDraft(course, { name: "Sem recesso" }), course).classGroup!
    expect(without.computedEndDate).toBe("2026-03-19")

    // Recesso de 18 a 20/03: com a prática já cumprida, sobra só teoria e ela não acontece em recesso.
    useHolidaysStore().create({ date: "2026-03-18", endDate: "2026-03-20", name: "Recesso", scope: "recess", recurring: false })

    const withRecess = store.save(apprenticeshipDraft(course, { name: "Com recesso", teacherId: "teacher-2" }), course).classGroup!
    expect(withRecess.computedEndDate).toBe("2026-03-24")
    expect(withRecess.computedClassDates.some((d) => d >= "2026-03-18" && d <= "2026-03-20")).toBe(false)
  })

  it("recesso não afeta cursos comuns", () => {
    useHolidaysStore().create({ date: "2026-03-04", endDate: "2026-03-10", name: "Recesso", scope: "recess", recurring: false })
    const course = useCoursesStore().create({ name: "Curso", totalWorkloadHours: 16, active: true })

    const cg = store.save(draft(course.id), course).classGroup!

    expect(cg.computedClassDates).toEqual(["2026-03-02", "2026-03-04", "2026-03-09", "2026-03-11"])
  })

  it("adiar uma turma de Aprendizagem também desloca a prática e preserva a previsão original", () => {
    const course = apprenticeshipCourse(40, 12)
    const cg = store.save(apprenticeshipDraft(course), course).classGroup!

    const result = store.postpone(cg.id, "2026-03-16", "2026-03-23")

    expect(result.ok).toBe(true)
    expect(result.classGroup?.computedPracticeDates).toEqual(["2026-03-23", "2026-03-24"])
    expect(result.classGroup?.originalEndDate).toBe("2026-03-17")
    expect(endDateDelayDays(result.classGroup!)).toBe(7)
  })

  it("dia de prática não gera conflito de professor; dia de teoria gera", () => {
    const course = apprenticeshipCourse(40, 12)
    store.save(apprenticeshipDraft(course), course)
    const plain = useCoursesStore().create({ name: "Curso comum", totalWorkloadHours: 4, active: true })

    // 16/03 é segunda de prática da Aprendizagem: o mesmo professor pode dar outra aula nesse dia/horário.
    const onPracticeDay = store.save(draft(plain.id, { name: "Comum na prática", startDate: "2026-03-16", weekdays: [1] }), plain)
    expect(onPracticeDay.ok).toBe(true)

    // 09/03 é segunda dentro dos 10 dias iniciais de teoria: conflito, embora a Aprendizagem seja qui/sex.
    const onTheoryDay = store.save(draft(plain.id, { name: "Comum na teoria", startDate: "2026-03-09", weekdays: [1] }), plain)
    expect(onTheoryDay.ok).toBe(false)
    expect(onTheoryDay.conflict?.kind).toBe("teacher")
  })
})

describe("holidays store — recessos", () => {
  it("recessos ficam fora dos feriados de um dia e viram períodos para o motor", () => {
    const holidays = useHolidaysStore()
    holidays.create({ date: "2026-07-01", name: "Feriado local", scope: "municipal", recurring: false })
    holidays.create({ date: "2026-07-06", endDate: "2026-07-17", name: "Recesso de julho", scope: "recess", recurring: false })

    expect(holidays.customHolidays.map((h) => h.name)).toEqual(["Feriado local"])
    expect(holidays.recesses.map((h) => h.name)).toEqual(["Recesso de julho"])
    expect(holidays.recessRanges).toEqual([{ startDate: "2026-07-06", endDate: "2026-07-17" }])
  })

  it("recesso sem data final é ignorado pelo motor", () => {
    const holidays = useHolidaysStore()
    holidays.create({ date: "2026-07-06", name: "Recesso incompleto", scope: "recess", recurring: false })

    expect(holidays.recessRanges).toEqual([])
  })
})
