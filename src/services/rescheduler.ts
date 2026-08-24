/**
 * Regras puras de reagendamento de turma por arraste no calendário
 * (drag-and-drop): dado que uma turma inteira é sempre gerada a partir
 * de uma única `startDate` (ver calendarEngine.ts), "arrastar uma aula"
 * significa deslocar essa `startDate` pelo mesmo número de dias que o
 * usuário arrastou, e recalcular toda a turma a partir da nova data.
 */

function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatIsoDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Diferença em dias corridos entre duas datas ISO ("YYYY-MM-DD"): `to` - `from`. */
export function diffInDays(from: string, to: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / msPerDay)
}

/** Aplica um deslocamento de dias corridos a uma data ISO. */
export function shiftIsoDate(iso: string, deltaDays: number): string {
  const date = parseIsoDate(iso)
  date.setUTCDate(date.getUTCDate() + deltaDays)
  return formatIsoDate(date)
}

export interface RescheduleDraftInput {
  /** Data de início atual (definida/confirmada) da turma. */
  currentStartDate: string
  /** Data original da aula que foi arrastada (pertence a computedClassDates). */
  draggedFromDate: string
  /** Data para onde a aula foi solta. */
  draggedToDate: string
}

export interface RescheduleDraftResult {
  /** Número de dias corridos que a turma inteira deve se deslocar. */
  deltaDays: number
  /** Nova startDate resultante, ANTES de qualquer confirmação de antecipação. */
  proposedStartDate: string
  /**
   * true quando a nova startDate fica antes da startDate atual — nesse
   * caso a UI deve pedir confirmação do usuário antes de efetivar,
   * avisando que o curso será antecipado.
   */
  requiresAdvanceConfirmation: boolean
}

/**
 * Calcula o efeito de arrastar uma aula de `draggedFromDate` para
 * `draggedToDate`: a turma inteira desloca pelo mesmo delta de dias
 * (regra de negócio: "mover a turma completa, aulas posteriores
 * empurradas para frente ou para trás"). Se o resultado antecipa a
 * turma em relação à `currentStartDate` definida, sinaliza que é
 * necessária confirmação do usuário antes de aplicar.
 */
export function computeRescheduleDraft(input: RescheduleDraftInput): RescheduleDraftResult {
  const { currentStartDate, draggedFromDate, draggedToDate } = input
  const deltaDays = diffInDays(draggedFromDate, draggedToDate)
  const proposedStartDate = shiftIsoDate(currentStartDate, deltaDays)

  return {
    deltaDays,
    proposedStartDate,
    requiresAdvanceConfirmation: proposedStartDate < currentStartDate,
  }
}

export interface PostponeDraftInput {
  /** Data original (no cronograma calculado) da aula que foi arrastada. */
  draggedFromDate: string
  /** Data para onde a aula foi solta. */
  draggedToDate: string
}

export type PostponeDraftResult =
  | { ok: true; shiftDays: number }
  /**
   * Adiamento pontual só empurra aulas para frente (representa uma falta/
   * pausa do professor) — soltar em uma data igual ou anterior à original
   * não é um adiamento válido; a UI deve orientar o usuário a soltar em
   * uma data posterior, ou usar o modo "mover a turma inteira" se a
   * intenção era antecipar.
   */
  | { ok: false; reason: "not-forward" }

/**
 * Calcula o efeito de "adiar a partir desta aula" (ex: professor faltou
 * uma semana): a aula em `draggedFromDate` e todas as seguintes no
 * cronograma deslocam `shiftDays` dias corridos para frente; aulas
 * anteriores nunca mudam (ver ClassPostponement em types/index.ts).
 */
export function computePostponeDraft(input: PostponeDraftInput): PostponeDraftResult {
  const shiftDays = diffInDays(input.draggedFromDate, input.draggedToDate)
  if (shiftDays <= 0) {
    return { ok: false, reason: "not-forward" }
  }
  return { ok: true, shiftDays }
}
