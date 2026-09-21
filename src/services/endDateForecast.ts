import type { ClassGroup } from "../types"
import { diffInDays } from "./rescheduler"

/**
 * Quantos dias corridos a previsão de encerramento da turma foi empurrada
 * por adiamentos (`postponements`) desde a última vez que a turma foi
 * salva/replanejada. Retorna 0 quando não há atraso, quando a turma não tem
 * `originalEndDate` (cadastrada antes do campo existir) ou quando alguma das
 * datas é desconhecida.
 */
export function endDateDelayDays(classGroup: Pick<ClassGroup, "originalEndDate" | "computedEndDate">): number {
  const { originalEndDate, computedEndDate } = classGroup
  if (!originalEndDate || !computedEndDate) return 0
  return Math.max(0, diffInDays(originalEndDate, computedEndDate))
}
