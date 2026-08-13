import { jsPDF } from "jspdf"
import { __createTable, __drawTable, type UserOptions } from "jspdf-autotable"
import type { ClassGroup, Course, Teacher } from "../types"
import { WEEKDAY_SHORT_LABELS } from "../constants/schedule"
import { timeSlotLabel } from "../constants/schedule"
import { USER_MANUAL_SECTIONS, USER_MANUAL_TITLE, type ManualContentBlock } from "../content/userManual"

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

/**
 * Créditos institucionais exibidos no rodapé de toda página gerada
 * pelo sistema, e na capa do manual do usuário.
 */
export const INSTITUTIONAL_CREDITS = {
  organization: "SENAC-PB — CEP Cajazeiras",
  developedBy: "Gervásio Teixeira",
  contactEmail: "gervasio.eufrazino@pb.senac.br",
}

/**
 * Caminho (relativo à raiz pública do site) de uma imagem PNG/JPEG da
 * logo do SENAC usada na capa do manual do usuário. O arquivo vive em
 * `public/senac-logo.png`. Se o arquivo for removido/renomeado, a
 * capa volta a mostrar um espaço reservado em texto no lugar da logo.
 */
export const INSTITUTIONAL_LOGO_PATH: string | null = `${import.meta.env.BASE_URL}senac-logo.png`

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
 * Aplica o rodapé institucional (créditos + numeração de página) em
 * TODAS as páginas já desenhadas no documento. Deve ser chamado por
 * último, depois que todo o conteúdo do PDF já foi montado — inserir
 * conteúdo novo depois disso desalinharia a paginação.
 */
function applyFooterToAllPages(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(220)
    doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16)

    doc.setFontSize(7.5)
    doc.setTextColor(140)
    doc.text(
      `${INSTITUTIONAL_CREDITS.organization} · Desenvolvido por ${INSTITUTIONAL_CREDITS.developedBy} — ${INSTITUTIONAL_CREDITS.contactEmail}`,
      14,
      pageHeight - 10,
    )
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: "right" })
    doc.setTextColor(0)
  }
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

  applyFooterToAllPages(doc)
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

  applyFooterToAllPages(doc)
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

/** Tenta carregar uma imagem como data URL; retorna null se não existir/falhar (não interrompe a geração do PDF). */
async function tryLoadImageAsDataUrl(path: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const response = await fetch(path)
    if (!response.ok) return null
    const blob = await response.blob()
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => reject(new Error("Falha ao carregar dimensões da imagem"))
      img.src = dataUrl
    })
    return { dataUrl, ...dimensions }
  } catch {
    return null
  }
}

function renderManualBlock(doc: jsPDF, block: ManualContentBlock, startY: number, marginX: number, contentWidth: number): number {
  let y = startY
  const pageHeight = doc.internal.pageSize.getHeight()

  function ensureSpace(lines: number, lineHeight: number): void {
    if (y + lines * lineHeight > pageHeight - 22) {
      doc.addPage()
      y = 20
    }
  }

  if (block.type === "paragraph") {
    doc.setFontSize(10.5)
    doc.setTextColor(40)
    const lines = doc.splitTextToSize(block.text, contentWidth)
    ensureSpace(lines.length, 5)
    doc.text(lines, marginX, y)
    y += lines.length * 5 + 3
    return y
  }

  // Lista (numerada ou com marcadores)
  doc.setFontSize(10.5)
  doc.setTextColor(40)
  block.items.forEach((item, index) => {
    const bullet = block.ordered ? `${index + 1}.` : "•"
    const lines = doc.splitTextToSize(item, contentWidth - 8)
    ensureSpace(lines.length, 5)
    doc.text(bullet, marginX, y)
    doc.text(lines, marginX + 7, y)
    y += lines.length * 5 + 1.5
  })
  y += 2
  return y
}

/**
 * Gera o PDF do manual do usuário, com capa institucional (logo,
 * quando disponível em `INSTITUTIONAL_LOGO_PATH`) e o conteúdo
 * estruturado em `content/userManual.ts`. Disponível para download
 * público — não depende de nenhum dado cadastrado no navegador.
 */
export async function generateUserManualPdf(): Promise<jsPDF> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginX = 18
  const contentWidth = pageWidth - marginX * 2

  // ---------- Capa ----------
  const logo = INSTITUTIONAL_LOGO_PATH ? await tryLoadImageAsDataUrl(INSTITUTIONAL_LOGO_PATH) : null

  if (logo) {
    const maxLogoWidth = 60
    const scale = maxLogoWidth / logo.width
    const logoWidth = maxLogoWidth
    const logoHeight = logo.height * scale
    const format = logo.dataUrl.startsWith("data:image/jpeg") || logo.dataUrl.startsWith("data:image/jpg") ? "JPEG" : "PNG"
    doc.addImage(logo.dataUrl, format, (pageWidth - logoWidth) / 2, 30, logoWidth, logoHeight)
  } else {
    // Espaço reservado enquanto a logo institucional não é fornecida.
    doc.setDrawColor(200)
    doc.rect((pageWidth - 60) / 2, 30, 60, 30)
    doc.setFontSize(8)
    doc.setTextColor(160)
    doc.text("Logo SENAC", pageWidth / 2, 47, { align: "center" })
    doc.setTextColor(0)
  }

  doc.setFontSize(20)
  doc.setTextColor(20)
  doc.text(USER_MANUAL_TITLE, pageWidth / 2, 90, { align: "center", maxWidth: contentWidth })

  doc.setFontSize(12)
  doc.setTextColor(90)
  doc.text(INSTITUTIONAL_CREDITS.organization, pageWidth / 2, 102, { align: "center" })

  doc.setFontSize(10)
  doc.setTextColor(130)
  const today = new Date()
  doc.text(
    `Documento gerado em ${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`,
    pageWidth / 2,
    110,
    { align: "center" },
  )
  doc.setTextColor(0)

  // ---------- Conteúdo ----------
  doc.addPage()
  let y = 20

  for (const section of USER_MANUAL_SECTIONS) {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage()
      y = 20
    }
    doc.setFontSize(13)
    doc.setTextColor(15)
    doc.text(section.heading, marginX, y)
    y += 7

    for (const block of section.blocks) {
      y = renderManualBlock(doc, block, y, marginX, contentWidth)
    }
    y += 3
  }

  applyFooterToAllPages(doc)
  return doc
}

export function downloadPdf(doc: jsPDF, filename: string): void {
  doc.save(filename)
}
