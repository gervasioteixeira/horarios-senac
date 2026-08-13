import { defineStore } from "pinia"
import { computed, ref } from "vue"
import type { Holiday } from "../types"
import { LOCAL_STORAGE_KEYS, persistToLocalStorage, readFromLocalStorage } from "../composables/useLocalStorage"
import { generateNationalHolidaysForYearRange } from "../services/holidayEngine"

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
  const customHolidays = computed(() => holidays.value.filter((h) => h.scope !== "national"))

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
    ensureNationalHolidaysForYear,
    create,
    remove,
    replaceAll,
  }
})
