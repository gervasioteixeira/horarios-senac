<script setup lang="ts">
import { computed } from "vue"
import type { MonthlyBreakdownEntry } from "../../types"

const props = defineProps<{
  breakdown: MonthlyBreakdownEntry[]
}>()

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function monthLabel(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month)
}

/** Turmas de Aprendizagem trazem também os dias/horas de prática (na empresa) de cada mês. */
const hasPractice = computed(() => props.breakdown.some((entry) => entry.practiceClassesCount !== undefined))

const totals = computed(() => {
  return props.breakdown.reduce(
    (acc, entry) => {
      acc.classesCount += entry.classesCount
      acc.hoursCount += entry.hoursCount
      acc.practiceClassesCount += entry.practiceClassesCount ?? 0
      acc.practiceHoursCount += entry.practiceHoursCount ?? 0
      return acc
    },
    { classesCount: 0, hoursCount: 0, practiceClassesCount: 0, practiceHoursCount: 0 },
  )
})
</script>

<template>
  <div class="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
    <table class="w-full text-left text-sm" :class="hasPractice ? 'min-w-[520px]' : 'min-w-[360px]'">
      <thead class="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        <tr>
          <th class="px-3 py-2 font-medium">Mês</th>
          <th class="px-3 py-2 font-medium">{{ hasPractice ? "Aulas (teoria)" : "Nº de aulas" }}</th>
          <th class="px-3 py-2 font-medium">{{ hasPractice ? "Horas de teoria" : "Horas" }}</th>
          <template v-if="hasPractice">
            <th class="px-3 py-2 font-medium">Dias de prática</th>
            <th class="px-3 py-2 font-medium">Horas de prática</th>
          </template>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
        <tr v-if="breakdown.length === 0">
          <td :colspan="hasPractice ? 5 : 3" class="px-3 py-3 text-center text-slate-400 dark:text-slate-500">Sem dados para exibir</td>
        </tr>
        <tr v-for="entry in breakdown" :key="`${entry.year}-${entry.month}`">
          <td class="px-3 py-2 text-slate-700 dark:text-slate-300">{{ monthLabel(entry.month) }}/{{ entry.year }}</td>
          <td class="px-3 py-2 text-slate-700 dark:text-slate-300">{{ entry.classesCount }}</td>
          <td class="px-3 py-2 text-slate-700 dark:text-slate-300">{{ entry.hoursCount }}h</td>
          <template v-if="hasPractice">
            <td class="px-3 py-2 text-slate-700 dark:text-slate-300">{{ entry.practiceClassesCount ?? 0 }}</td>
            <td class="px-3 py-2 text-slate-700 dark:text-slate-300">{{ entry.practiceHoursCount ?? 0 }}h</td>
          </template>
        </tr>
      </tbody>
      <tfoot v-if="breakdown.length > 0" class="border-t border-slate-200 bg-slate-50 font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        <tr>
          <td class="px-3 py-2">Total</td>
          <td class="px-3 py-2">{{ totals.classesCount }}</td>
          <td class="px-3 py-2">{{ totals.hoursCount }}h</td>
          <template v-if="hasPractice">
            <td class="px-3 py-2">{{ totals.practiceClassesCount }}</td>
            <td class="px-3 py-2">{{ totals.practiceHoursCount }}h</td>
          </template>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
