import { describe, expect, it } from "vitest"
import { generateClassGroupPdf, generateTeacherPdf } from "../../src/services/pdfGenerator"
import type { ClassGroup, Course, Teacher } from "../../src/types"

const teacher: Teacher = {
  id: "t-1",
  name: "Professora Teste",
  colorHex: "#3b82f6",
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

function course(overrides: Partial<Course> = {}): Course {
  return {
    id: "c-1",
    name: "Curso Teste",
    totalWorkloadHours: 16,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function classGroup(overrides: Partial<ClassGroup> = {}): ClassGroup {
  return {
    id: "cg-1",
    courseId: "c-1",
    teacherId: "t-1",
    name: "Turma Teste",
    startDate: "2026-03-02",
    dailyWorkloadHours: 4,
    weekdays: [1, 3],
    timeSlot: { period: "morning", start: "07:00", end: "12:00" },
    status: "planned",
    originalEndDate: "2026-03-11",
    computedEndDate: "2026-03-11",
    computedMonthlyBreakdown: [{ year: 2026, month: 3, classesCount: 4, hoursCount: 16 }],
    computedClassDates: ["2026-03-02", "2026-03-04", "2026-03-09", "2026-03-11"],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

/** Texto bruto do PDF (jsPDF grava o texto sem compressão, então dá para procurar trechos ASCII). */
function pdfText(doc: { output(type: "arraybuffer"): ArrayBuffer }): string {
  return Buffer.from(doc.output("arraybuffer")).toString("latin1")
}

describe("pdfGenerator.generateClassGroupPdf", () => {
  it("mostra o encerramento previsto e não menciona atraso quando a previsão não mudou", () => {
    const text = pdfText(generateClassGroupPdf(classGroup(), course(), teacher))

    expect(text).toContain("Encerramento previsto: 11/03/2026")
    expect(text).not.toContain("Previsao original")
    expect(text).not.toContain("adiada em")
  })

  it("mostra a previsão original e o atraso quando houve adiamento", () => {
    const text = pdfText(
      generateClassGroupPdf(classGroup({ originalEndDate: "2026-03-11", computedEndDate: "2026-03-18" }), course(), teacher),
    )

    expect(text).toContain("Encerramento previsto: 18/03/2026")
    expect(text).toContain("adiada em 7 dia") // "(s)" fica escapado no PDF
    expect(text).toContain("11/03/2026")
  })

  it("inclui a tabela de UCs com datas quando o curso tem UCs", () => {
    const units = [
      { id: "u1", name: "Primeira UC", workloadHours: 8, kind: "theory" as const },
      { id: "u2", name: "Segunda UC", workloadHours: 8, kind: "theory" as const },
    ]
    const text = pdfText(generateClassGroupPdf(classGroup(), course({ units }), teacher))

    expect(text).toContain("Unidades Curriculares")
    expect(text).toContain("1. Primeira UC")
    expect(text).toContain("2. Segunda UC")
    // 1ª UC = 2 aulas (02/03 a 04/03); 2ª UC = 2 aulas (09/03 a 11/03).
    expect(text).toContain("04/03/2026")
    expect(text).toContain("09/03/2026")
  })

  it("curso sem UCs não tem a seção de UCs", () => {
    expect(pdfText(generateClassGroupPdf(classGroup(), course(), teacher))).not.toContain("Unidades Curriculares")
  })

  it("turma de Aprendizagem mostra teoria, prática e a coluna de atividade no calendário", () => {
    const apprenticeship = classGroup({
      practiceDailyHours: 6,
      computedClassDates: ["2026-03-02", "2026-03-03"],
      computedPracticeDates: ["2026-03-16"],
      computedMonthlyBreakdown: [
        { year: 2026, month: 3, classesCount: 2, hoursCount: 8, practiceClassesCount: 1, practiceHoursCount: 6 },
      ],
    })
    const text = pdfText(
      generateClassGroupPdf(
        apprenticeship,
        course({
          isApprenticeship: true,
          units: [
            { id: "u1", name: "Teoria UC", workloadHours: 8, kind: "theory" },
            { id: "u2", name: "Pratica UC", workloadHours: 6, kind: "practice" },
          ],
        }),
        teacher,
      ),
    )

    expect(text).toContain("Dias de teoria")
    expect(text).toMatch(/pr(á|\\341)tica 6h/) // jsPDF grava "á" como byte latin1 (ou escape octal)
    expect(text).toContain("Atividade")
    expect(text).toContain("Teoria")
    expect(text).toContain("16/03/2026")
  })
})

describe("pdfGenerator.generateTeacherPdf", () => {
  it("usa 'Encerramento previsto' no cabeçalho da coluna", () => {
    const text = pdfText(generateTeacherPdf(teacher, [classGroup()], new Map([["c-1", course()]])))
    expect(text).toContain("Encerramento previsto")
  })
})
