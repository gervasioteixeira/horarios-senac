import { watch, type Ref } from "vue"

const STORAGE_PREFIX = "horarios-senac:"

/**
 * Lê um valor inicial do localStorage (se existir e for JSON válido).
 * Usado para inicializar o state de uma store Pinia.
 */
export function readFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (err) {
    console.warn(`[horarios-senac] Falha ao ler "${key}" do localStorage, usando valor padrão.`, err)
    return fallback
  }
}

/**
 * Mantém um Ref sincronizado com o localStorage: toda alteração no ref
 * é persistida automaticamente. Usado dentro das stores Pinia para
 * garantir que cadastros de professores/cursos/turmas/feriados
 * sobrevivam a um recarregamento da página.
 */
export function persistToLocalStorage<T>(key: string, source: Ref<T>): void {
  if (typeof window === "undefined") return
  watch(
    source,
    (value) => {
      try {
        window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
      } catch (err) {
        console.error(`[horarios-senac] Falha ao salvar "${key}" no localStorage.`, err)
      }
    },
    { deep: true },
  )
}

export function clearAllLocalStorage(keys: string[]): void {
  if (typeof window === "undefined") return
  for (const key of keys) {
    window.localStorage.removeItem(STORAGE_PREFIX + key)
  }
}

export const LOCAL_STORAGE_KEYS = {
  teachers: "teachers",
  courses: "courses",
  holidays: "holidays",
  classGroups: "classGroups",
  rooms: "rooms",
} as const
