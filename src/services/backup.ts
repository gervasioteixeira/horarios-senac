import type { BackupPayload, ClassGroup, Course, Holiday, Teacher } from "../types"

export const BACKUP_SCHEMA_VERSION = 1

export interface BackupSourceData {
  teachers: Teacher[]
  courses: Course[]
  holidays: Holiday[]
  classGroups: ClassGroup[]
}

/** Monta o payload de backup a partir dos dados atuais das stores. */
export function buildBackupPayload(data: BackupSourceData): BackupPayload {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2)
}

export class InvalidBackupFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidBackupFileError"
  }
}

/**
 * Valida e faz o parse de um JSON de backup importado pela usuária.
 * Lança InvalidBackupFileError com mensagem amigável se a estrutura
 * não for reconhecida, sem nunca lançar um erro "cru" de JSON.parse.
 */
export function parseBackupFile(rawContent: string): BackupPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawContent)
  } catch {
    throw new InvalidBackupFileError("O arquivo selecionado não é um JSON válido. Verifique se é o arquivo de backup correto.")
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new InvalidBackupFileError("O arquivo de backup está em um formato inesperado.")
  }

  const candidate = parsed as Partial<BackupPayload>

  if (typeof candidate.schemaVersion !== "number") {
    throw new InvalidBackupFileError("O arquivo não parece ser um backup do Horários Senac (faltando versão do esquema).")
  }

  if (candidate.schemaVersion > BACKUP_SCHEMA_VERSION) {
    throw new InvalidBackupFileError(
      "Este arquivo de backup foi gerado por uma versão mais nova do sistema. Atualize o sistema antes de importar.",
    )
  }

  if (!candidate.data || typeof candidate.data !== "object") {
    throw new InvalidBackupFileError("O arquivo de backup não contém dados.")
  }

  const data = candidate.data as Partial<BackupSourceData>
  const requiredKeys: Array<keyof BackupSourceData> = ["teachers", "courses", "holidays", "classGroups"]
  for (const key of requiredKeys) {
    if (!Array.isArray(data[key])) {
      throw new InvalidBackupFileError(`O arquivo de backup está incompleto (faltando "${key}").`)
    }
  }

  return candidate as BackupPayload
}

/**
 * Dispara o download do backup como arquivo .json no navegador.
 * Só funciona em ambiente de navegador (usa document/URL/Blob).
 */
export function downloadBackupFile(payload: BackupPayload, filenamePrefix = "horarios-senac-backup"): void {
  const json = serializeBackup(payload)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const dateStamp = payload.exportedAt.slice(0, 10)

  const link = document.createElement("a")
  link.href = url
  link.download = `${filenamePrefix}-${dateStamp}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Lê o conteúdo de um File (input type="file") como texto, via Promise. */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o arquivo."))
    reader.readAsText(file)
  })
}
