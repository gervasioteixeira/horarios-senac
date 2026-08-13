import { ref, watchEffect } from "vue"

export type ThemePreference = "light" | "dark" | "system"

const STORAGE_KEY = "horarios-senac:theme"

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system"
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system"
}

/** Preferência escolhida pela usuária: "light", "dark" ou "system" (segue o SO). */
const preference = ref<ThemePreference>(readStoredPreference())

const systemPrefersDark =
  typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null

/** Reflete se o tema *efetivo* atual é escuro (já resolvendo "system"). */
const isDark = ref(resolveIsDark())

function resolveIsDark(): boolean {
  if (preference.value === "dark") return true
  if (preference.value === "light") return false
  return systemPrefersDark?.matches ?? false
}

function applyTheme(): void {
  isDark.value = resolveIsDark()
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("dark", isDark.value)
}

// Reage a mudanças de preferência (inclusive vindas de outra aba, via storage event indireto).
watchEffect(applyTheme)

// Quando em modo "system", reage a mudanças de tema do sistema operacional em tempo real.
systemPrefersDark?.addEventListener("change", () => {
  if (preference.value === "system") applyTheme()
})

function setThemePreference(next: ThemePreference): void {
  preference.value = next
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, next)
  }
}

/**
 * Composable de tema (claro/escuro/segundo o sistema). Aplica a classe
 * `.dark` no <html>, que ativa a variante `dark:` do Tailwind (ver
 * `@custom-variant dark` em style.css). Persiste a escolha da usuária
 * no localStorage e reage a mudanças do tema do sistema operacional
 * quando a preferência é "system".
 */
export function useTheme() {
  return { preference, isDark, setThemePreference }
}
