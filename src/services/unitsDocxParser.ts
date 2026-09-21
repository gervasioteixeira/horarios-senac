import { unzipSync } from "fflate"
import type { CourseUnitKind } from "../types"

/**
 * Leitura, no navegador, da lista de Unidades Curriculares exportada por outro
 * sistema em um arquivo .docx: uma tabela com colunas "UC | UNIDADE CURRICULAR
 * | CH" e uma linha final "Carga Horária Total". Um .docx é um zip; só o
 * `word/document.xml` interessa.
 */

export interface ParsedUnit {
  name: string
  workloadHours: number
  kind: CourseUnitKind
}

export interface ParsedUnitsFile {
  /** Nome sugerido para o curso, tirado do título do documento (ex: "Aprendizagem Profissional"). */
  courseName?: string
  units: ParsedUnit[]
  /** Carga horária total declarada na linha "Carga Horária Total" do arquivo, se houver. */
  declaredTotalHours?: number
  /** Avisos não bloqueantes (ex: total declarado diferente da soma das UCs). */
  warnings: string[]
}

export class InvalidUnitsFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidUnitsFileError"
  }
}

const WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "")
}

/** Interpreta números no formato pt-BR: "28", "1.162" (milhar), "20,5" (decimal). */
function parsePtBrNumber(raw: string): number | null {
  const text = normalizeText(raw)
  if (!text) return null
  const withoutThousands = /^\d{1,3}(\.\d{3})+$/.test(text) ? text.replace(/\./g, "") : text
  const value = Number(withoutThousands.replace(",", "."))
  return Number.isFinite(value) ? value : null
}

function paragraphText(paragraph: Element): string {
  let text = ""
  for (const node of Array.from(paragraph.getElementsByTagNameNS(WORD_NS, "*"))) {
    if (node.localName === "t") text += node.textContent ?? ""
    else if (node.localName === "tab" || node.localName === "br") text += " "
  }
  return text
}

/** Texto de um elemento (célula ou corpo), com os parágrafos separados por espaço. */
function blockText(element: Element): string {
  return normalizeText(
    Array.from(element.getElementsByTagNameNS(WORD_NS, "p"))
      .map(paragraphText)
      .join(" "),
  )
}

/** A UC de prática (Prática Profissional Supervisionada) é reconhecida pelo nome; o resto é teoria. */
function guessKind(name: string): CourseUnitKind {
  return /pratica profissional/.test(stripAccents(name).toLowerCase()) ? "practice" : "theory"
}

function readDocumentXml(data: Uint8Array): string {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(data, { filter: (file) => file.name === "word/document.xml" })
  } catch {
    throw new InvalidUnitsFileError("O arquivo não parece ser um documento Word (.docx) válido.")
  }
  const xml = files["word/document.xml"]
  if (!xml) {
    throw new InvalidUnitsFileError("O arquivo não parece ser um documento Word (.docx) válido.")
  }
  return new TextDecoder("utf-8").decode(xml)
}

export function parseUnitsFromDocx(data: Uint8Array): ParsedUnitsFile {
  const xml = new DOMParser().parseFromString(readDocumentXml(data), "application/xml")
  if (xml.getElementsByTagName("parsererror").length > 0) {
    throw new InvalidUnitsFileError("Não foi possível ler o conteúdo do documento.")
  }

  const units: ParsedUnit[] = []
  let declaredTotalHours: number | undefined

  for (const row of Array.from(xml.getElementsByTagNameNS(WORD_NS, "tr"))) {
    const cells = Array.from(row.children)
      .filter((child) => child.localName === "tc")
      .map(blockText)
    if (cells.length < 2) continue

    const first = cells[0]
    const last = parsePtBrNumber(cells[cells.length - 1])

    if (/^carga horaria total/.test(stripAccents(first).toLowerCase())) {
      if (last !== null) declaredTotalHours = last
      continue
    }

    // Linha de UC: primeira coluna é o número da UC, última é a carga horária.
    if (cells.length >= 3 && /^\d+$/.test(first) && last !== null && last > 0) {
      const name = normalizeText(cells.slice(1, -1).join(" "))
      if (name) units.push({ name, workloadHours: last, kind: guessKind(name) })
    }
  }

  if (units.length === 0) {
    throw new InvalidUnitsFileError(
      "Não encontrei nenhuma Unidade Curricular no documento. Esperado: uma tabela com as colunas UC, Unidade Curricular e CH.",
    )
  }

  const warnings: string[] = []
  const sum = Math.round(units.reduce((total, u) => total + u.workloadHours, 0) * 100) / 100
  if (declaredTotalHours !== undefined && declaredTotalHours !== sum) {
    warnings.push(`A carga horária total do arquivo (${declaredTotalHours}h) é diferente da soma das UCs (${sum}h). Confira os valores.`)
  }

  const body = xml.getElementsByTagNameNS(WORD_NS, "body")[0]
  const title = body
    ? Array.from(body.children)
        .filter((child) => child.localName === "p")
        .map((paragraph) => normalizeText(paragraphText(paragraph)))
        .find(Boolean)
    : undefined
  const courseName = title ? normalizeText(title.replace(/^unidades curriculares\s*/i, "")) : ""

  return { courseName: courseName || undefined, units, declaredTotalHours, warnings }
}
