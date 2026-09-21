import { defineStore } from "pinia"
import { computed, ref } from "vue"
import type { Holiday } from "../types"
import { LOCAL_STORAGE_KEYS, persistToLocalStorage, readFromLocalStorage } from "../composables/useLocalStorage"
import { generateNationalHolidaysForYearRange } from "../services/holidayEngine"
import type { RecessRange } from "../services/apprenticeshipEngine"

function generateId(): string {
  return `holiday-${crypto.randomUUID()}`
}

/**
 * Faixa de anos pré-carregada por padrão com feriados nacionais ao
 * inicializar o sistema pela primeira vez num navegador (ano atual -1
 * até ano atual +3). Cobre a criação de turmas de médio prazo sem
 * exigir configuração manual. `ensureNationalHolidaysForYear` estende
 * essa cobertura sob demanda quando uma turma ultrapassa esse horizonte.
 */
function defaultYearRange(): [number, number] {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear + 3]
}

export const useHolidaysStore = defineStore("holidays", () => {
  const seeded = readFromLocalStorage<Holiday[] | null>(LOCAL_STORAGE_KEYS.holidays, null)
  const holidays = ref<Holiday[]>(seeded ?? generateNationalHolidaysForYearRange(...defaultYearRange()))
  persistToLocalStorage(LOCAL_STORAGE_KEYS.holidays, holidays)

  const nationalHolidays = computed(() => holidays.value.filter((h) => h.scope === "national"))
  /** Feriados de um dia só cadastrados manualmente (estaduais/municipais/outros). Exclui recessos. */
  const customHolidays = computed(() => holidays.value.filter((h) => h.scope !== "national" && h.scope !== "recess"))
  /** Recessos escolares (períodos). Só afetam cursos de Aprendizagem — ver apprenticeshipEngine.ts. */
  const recesses = computed(() => holidays.value.filter((h) => h.scope === "recess"))
  const recessRanges = computed<RecessRange[]>(() =>
    recesses.value.filter((h) => h.endDate).map((h) => ({ startDate: h.date, endDate: h.endDate! })),
  )

  /** Garante que os feriados nacionais de um dado ano estejam presentes (idempotente). */
  function ensureNationalHolidaysForYear(year: number): void {
    const hasYear = holidays.value.some((h) => h.scope === "national" && h.date.startsWith(String(year)))
    if (hasYear) return
    holidays.value.push(...generateNationalHolidaysForYearRange(year, year))
  }

  function create(input: Omit<Holiday, "id">): Holiday {
    const holiday: Holiday = { ...input, id: generateId() }
    holidays.value.push(holiday)
    return holiday
  }

  function remove(id: string): void {
    holidays.value = holidays.value.filter((h) => h.id !== id)
  }

  function replaceAll(newHolidays: Holiday[]): void {
    holidays.value = newHolidays
  }

  return {
    holidays,
    nationalHolidays,
    customHolidays,
    recesses,
    recessRanges,
    ensureNationalHolidaysForYear,
    create,
    remove,
    replaceAll,
  }
})
