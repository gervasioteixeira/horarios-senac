import { jsPDF } from "jspdf"
import { __createTable, __drawTable, type UserOptions } from "jspdf-autotable"
import type { ClassGroup, Course, Teacher } from "../types"
import { WEEKDAY_SHORT_LABELS } from "../constants/schedule"
import { timeSlotLabel } from "../constants/schedule"

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function formatDateBr(iso: string | null): string {
  if (!iso) return "—"
  const [year, month, day] = iso.split("-")
  return `${day}/${month}/${year}`
}

function weekdayLabelOfDate(iso: string): string {
  const day = new Date(iso + "T00:00:00Z").getUTCDay()
  // WEEKDAY_SHORT_LABELS não cobre domingo (0); aulas nunca caem em domingo.
  return day === 0 ? "Dom" : WEEKDAY_SHORT_LABELS[day as 1 | 2 | 3 | 4 | 5 | 6]
}

function addHeader(doc: jsPDF, title: string, subtitleLines: string[]): number {
  doc.setFontSize(16)
  doc.text(title, 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(90)
  let y = 26
  for (const line of subtitleLines) {
    doc.text(line, 14, y)
    y += 5
  }
  doc.setTextColor(0)
  return y + 4
}

/** Desenha uma tabela e retorna o Y final (abaixo dela), para encadear a próxima seção do PDF. */
function drawTableAndGetFinalY(doc: jsPDF, options: UserOptions): number {
  const table = __createTable(doc, options)
  __drawTable(doc, table)
  return table.finalY ?? (options.startY as number) ?? 20
}

/**
 * Gera o PDF de uma turma: dados cadastrais, calendário de aulas
 * (data, dia da semana) e resumo de carga horária mensal.
 */
export function generateClassGroupPdf(classGroup: ClassGroup, course: Course, teacher: Teacher): jsPDF {
  const doc = new jsPDF()

  let y = addHeader(doc, classGroup.name, [
    `Curso: ${course.name}  |  Carga horária total: ${course.totalWorkloadHours}h`,
    `Professor(a): ${teacher.name}`,
    `Dias da semana: ${classGroup.weekdays.map((d) => WEEKDAY_SHORT_LABELS[d]).join(", ")}  |  Horário: ${timeSlotLabel(classGroup.timeSlot)}`,
    `Início: ${formatDateBr(classGroup.startDate)}  |  Término previsto: ${formatDateBr(classGroup.computedEndDate)}`,
  ])

  y = drawTableAndGetFinalY(doc, {
    startY: y,
    head: [["Resumo de carga horária por mês"]],
    body: [],
    theme: "plain",
    styles: { fontStyle: "bold" },
  })

  y = drawTableAndGetFinalY(doc, {
    startY: y + 2,
    head: [["Mês/Ano", "Nº de aulas", "Horas"]],
    body: classGroup.computedMonthlyBreakdown.map((entry) => [
      `${MONTH_NAMES_PT[entry.month - 1]}/${entry.year}`,
      String(entry.classesCount),
      `${entry.hoursCount}h`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59] },
  })

  y = drawTableAndGetFinalY(doc, {
    startY: y + 8,
    head: [["Calendário de aulas"]],
    body: [],
    theme: "plain",
    styles: { fontStyle: "bold" },
  })

  drawTableAndGetFinalY(doc, {
    startY: y + 2,
    head: [["#", "Data", "Dia da semana"]],
    body: classGroup.computedClassDates.map((date, index) => [String(index + 1), formatDateBr(date), weekdayLabelOfDate(date)]),
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59] },
  })

  return doc
}

/**
 * Gera o PDF consolidado de um professor: dados cadastrais e a
 * agenda de todas as turmas dele (curso, dias, horário, vigência).
 */
export function generateTeacherPdf(teacher: Teacher, classGroups: ClassGroup[], coursesById: Map<string, Course>): jsPDF {
  const doc = new jsPDF()

  const y = addHeader(doc, `Agenda do(a) Professor(a) ${teacher.name}`, [
    teacher.email ? `E-mail: ${teacher.email}` : "",
    teacher.phone ? `Telefone: ${teacher.phone}` : "",
    `Total de turmas: ${classGroups.length}`,
  ].filter(Boolean))

  drawTableAndGetFinalY(doc, {
    startY: y,
    head: [["Turma", "Curso", "Dias", "Horário", "Início", "Término", "Status"]],
    body: classGroups.map((cg) => [
      cg.name,
      coursesById.get(cg.courseId)?.name ?? "—",
      cg.weekdays.map((d) => WEEKDAY_SHORT_LABELS[d]).join(", "),
      timeSlotLabel(cg.timeSlot),
      formatDateBr(cg.startDate),
      formatDateBr(cg.computedEndDate),
      statusLabel(cg.status),
    ]),
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 9 },
  })

  return doc
}

function statusLabel(status: ClassGroup["status"]): string {
  switch (status) {
    case "planned": return "Planejada"
    case "ongoing": return "Em andamento"
    case "finished": return "Concluída"
    case "cancelled": return "Cancelada"
  }
}

export function downloadPdf(doc: jsPDF, filename: string): void {
  doc.save(filename)
}
