import { strToU8, zipSync } from "fflate"
import { describe, expect, it } from "vitest"
import { InvalidUnitsFileError, parseUnitsFromDocx } from "../../src/services/unitsDocxParser"

const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

function cell(text: string | string[], span?: number): string {
  const paragraphs = Array.isArray(text) ? text : [text]
  const props = span ? `<w:tcPr><w:gridSpan w:val="${span}"/></w:tcPr>` : ""
  return `<w:tc>${props}${paragraphs.map((p) => `<w:p><w:r><w:t xml:space="preserve">${p}</w:t></w:r></w:p>`).join("")}</w:tc>`
}

function row(...cells: string[]): string {
  return `<w:tr>${cells.join("")}</w:tr>`
}

/** Monta um .docx mínimo (zip com word/document.xml) com o corpo informado. */
function buildDocx(bodyXml: string): Uint8Array {
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W_NS}"><w:body>${bodyXml}</w:body></w:document>`
  return zipSync({ "word/document.xml": strToU8(xml) })
}

const HEADER = row(cell("UC"), cell("UNIDADE CURRICULAR"), cell("CH"))

describe("unitsDocxParser.parseUnitsFromDocx", () => {
  it("lê as UCs, o nome do curso pelo título e o total declarado", () => {
    const docx = buildDocx(
      `<w:p><w:r><w:t>Unidades Curriculares Aprendizagem Profissional</w:t></w:r></w:p>` +
        `<w:tbl>${HEADER}` +
        row(cell("1"), cell("Desenvolvimento Socioemocional"), cell("60")) +
        row(cell("2"), cell("Bem Estar Pessoal E Social Dos Jovens"), cell("20")) +
        row(cell("3"), cell("Prática Profissional Supervisionada"), cell("762")) +
        row(cell("Carga Horária Total:", 2), cell("842")) +
        `</w:tbl>`,
    )

    const result = parseUnitsFromDocx(docx)

    expect(result.courseName).toBe("Aprendizagem Profissional")
    expect(result.units).toEqual([
      { name: "Desenvolvimento Socioemocional", workloadHours: 60, kind: "theory" },
      { name: "Bem Estar Pessoal E Social Dos Jovens", workloadHours: 20, kind: "theory" },
      { name: "Prática Profissional Supervisionada", workloadHours: 762, kind: "practice" },
    ])
    expect(result.declaredTotalHours).toBe(842)
    expect(result.warnings).toEqual([])
  })

  it("junta parágrafos e espaços duplicados dentro do nome da UC", () => {
    const docx = buildDocx(
      `<w:tbl>${HEADER}` +
        row(cell("8"), cell(["Atender Às Demandas De Clientes E Demais Partes ", "Interessadas No Negócio"]), cell("60")) +
        `</w:tbl>`,
    )
    expect(parseUnitsFromDocx(docx).units[0].name).toBe("Atender Às Demandas De Clientes E Demais Partes Interessadas No Negócio")
  })

  it("interpreta o total com separador de milhar (1.162) e avisa quando difere da soma das UCs", () => {
    const docx = buildDocx(
      `<w:tbl>${HEADER}` +
        row(cell("1"), cell("Desenvolvimento Socioemocional"), cell("60")) +
        row(cell("Carga Horária Total:", 2), cell("1.162")) +
        `</w:tbl>`,
    )
    const result = parseUnitsFromDocx(docx)
    expect(result.declaredTotalHours).toBe(1162)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain("1162h")
    expect(result.warnings[0]).toContain("60h")
  })

  it("aceita carga horária decimal com vírgula", () => {
    const docx = buildDocx(`<w:tbl>${HEADER}` + row(cell("1"), cell("Oficina"), cell("20,5")) + `</w:tbl>`)
    expect(parseUnitsFromDocx(docx).units[0].workloadHours).toBe(20.5)
  })

  it("ignora o cabeçalho e linhas que não são UCs; sem título não sugere nome de curso", () => {
    const docx = buildDocx(`<w:tbl>${HEADER}` + row(cell("1"), cell("Oficina"), cell("20")) + `</w:tbl>`)
    const result = parseUnitsFromDocx(docx)
    expect(result.units).toHaveLength(1)
    expect(result.courseName).toBeUndefined()
  })

  it("rejeita arquivo que não é um .docx", () => {
    expect(() => parseUnitsFromDocx(strToU8("isto não é um zip"))).toThrow(InvalidUnitsFileError)
  })

  it("rejeita zip sem word/document.xml", () => {
    expect(() => parseUnitsFromDocx(zipSync({ "outra-coisa.txt": strToU8("x") }))).toThrow(InvalidUnitsFileError)
  })

  it("rejeita documento sem nenhuma tabela de UCs", () => {
    const docx = buildDocx(`<w:p><w:r><w:t>Só um texto qualquer</w:t></w:r></w:p>`)
    expect(() => parseUnitsFromDocx(docx)).toThrow(InvalidUnitsFileError)
  })
})
