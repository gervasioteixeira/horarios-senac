<script setup lang="ts">
import { useTheme, type ThemePreference } from "../../composables/useTheme"

const { preference, setThemePreference } = useTheme()

const OPTIONS: Array<{ value: ThemePreference; label: string; symbol: string }> = [
  { value: "light", label: "Tema claro", symbol: "☀" },
  { value: "dark", label: "Tema escuro", symbol: "☾" },
  { value: "system", label: "Tema do sistema", symbol: "⚙" },
]
</script>

<template>
  <div class="flex rounded-md border border-slate-300 p-0.5 text-xs dark:border-slate-600" role="radiogroup" aria-label="Aparência do sistema">
    <button
      v-for="opt in OPTIONS"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="preference === opt.value"
      :aria-label="opt.label"
      :title="opt.label"
      class="rounded px-2.5 py-1.5 font-medium"
      :class="
        preference === opt.value
          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
      "
      @click="setThemePreference(opt.value)"
    >
      <span aria-hidden="true">{{ opt.symbol }}</span>
      <span class="sr-only">{{ opt.label }}</span>
    </button>
  </div>
</template>
