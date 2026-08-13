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

const totals = computed(() => {
  return props.breakdown.reduce(
    (acc, entry) => {
      acc.classesCount += entry.classesCount
      acc.hoursCount += entry.hoursCount
      return acc
    },
    { classesCount: 0, hoursCount: 0 },
  )
})
</script>

<template>
  <div class="overflow-x-auto rounded-md border border-slate-200">
    <table class="w-full min-w-[360px] text-left text-sm">
      <thead class="bg-slate-50 text-xs uppercase text-slate-500">
        <tr>
          <th class="px-3 py-2 font-medium">Mês</th>
          <th class="px-3 py-2 font-medium">Nº de aulas</th>
          <th class="px-3 py-2 font-medium">Horas</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr v-if="breakdown.length === 0">
          <td colspan="3" class="px-3 py-3 text-center text-slate-400">Sem dados para exibir</td>
        </tr>
        <tr v-for="entry in breakdown" :key="`${entry.year}-${entry.month}`">
          <td class="px-3 py-2 text-slate-700">{{ monthLabel(entry.month) }}/{{ entry.year }}</td>
          <td class="px-3 py-2 text-slate-700">{{ entry.classesCount }}</td>
          <td class="px-3 py-2 text-slate-700">{{ entry.hoursCount }}h</td>
        </tr>
      </tbody>
      <tfoot v-if="breakdown.length > 0" class="border-t border-slate-200 bg-slate-50 font-medium text-slate-700">
        <tr>
          <td class="px-3 py-2">Total</td>
          <td class="px-3 py-2">{{ totals.classesCount }}</td>
          <td class="px-3 py-2">{{ totals.hoursCount }}h</td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
