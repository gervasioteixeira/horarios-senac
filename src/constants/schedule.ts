import type { TimeSlot, Weekday } from "../types"

/**
 * Faixas de horário estritamente permitidas (regra de negócio 2).
 * O formulário de turma deve sempre escolher a partir desta lista —
 * nunca aceitar horário livre digitado pelo usuário.
 */
export const ALLOWED_TIME_SLOTS: TimeSlot[] = [
  { period: "morning", start: "07:00", end: "12:00" },
  { period: "morning", start: "08:00", end: "12:00" },
  { period: "afternoon", start: "13:00", end: "17:00" },
  { period: "afternoon", start: "13:00", end: "18:00" },
  { period: "evening", start: "18:00", end: "22:00" },
  { period: "evening", start: "18:00", end: "21:00" },
  { period: "evening", start: "19:00", end: "22:00" },
]

export const TIME_PERIOD_LABELS: Record<TimeSlot["period"], string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
}

/** Rótulos em português dos dias da semana permitidos (segunda a sábado). */
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
}

export const WEEKDAY_SHORT_LABELS: Record<Weekday, string> = {
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
}

export const ALL_WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6]

export function timeSlotLabel(slot: TimeSlot): string {
  return `${TIME_PERIOD_LABELS[slot.period]} (${slot.start} às ${slot.end})`
}

export function isAllowedTimeSlot(slot: Pick<TimeSlot, "start" | "end">): boolean {
  return ALLOWED_TIME_SLOTS.some((s) => s.start === slot.start && s.end === slot.end)
}

/** Duração em horas de uma faixa de horário (ex: "08:00"-"12:00" => 4). */
export function timeSlotDurationHours(slot: Pick<TimeSlot, "start" | "end">): number {
  const [startH, startM] = slot.start.split(":").map(Number)
  const [endH, endM] = slot.end.split(":").map(Number)
  return (endH * 60 + endM - (startH * 60 + startM)) / 60
}
