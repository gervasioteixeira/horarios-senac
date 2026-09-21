<script setup lang="ts">
import { formatDateBr } from "../../constants/format"
import type { UnitScheduleEntry } from "../../services/unitSchedule"

defineProps<{
  entries: UnitScheduleEntry[]
}>()

const KIND_LABELS = { theory: "Teoria", practice: "Prática" } as const
</script>

<template>
  <div class="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
    <table class="w-full min-w-[560px] text-left text-sm">
      <thead class="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        <tr>
          <th class="px-3 py-2 font-medium">UC</th>
          <th class="px-3 py-2 font-medium">Tipo</th>
          <th class="px-3 py-2 font-medium">CH</th>
          <th class="px-3 py-2 font-medium">Início</th>
          <th class="px-3 py-2 font-medium">Término</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
        <tr v-if="entries.length === 0">
          <td colspan="5" class="px-3 py-3 text-center text-slate-400 dark:text-slate-500">Sem UCs para exibir</td>
        </tr>
        <tr v-for="(entry, index) in entries" :key="entry.unit.id">
          <td class="px-3 py-2 text-slate-700 dark:text-slate-300">{{ index + 1 }}. {{ entry.unit.name }}</td>
          <td class="px-3 py-2">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium"
              :class="entry.unit.kind === 'practice' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300'"
            >
              {{ KIND_LABELS[entry.unit.kind] }}
            </span>
          </td>
          <td class="px-3 py-2 text-slate-700 dark:text-slate-300">{{ entry.unit.workloadHours }}h</td>
          <td class="px-3 py-2 text-slate-700 dark:text-slate-300">{{ entry.startDate ? formatDateBr(entry.startDate) : "—" }}</td>
          <td class="px-3 py-2 text-slate-700 dark:text-slate-300">{{ entry.endDate ? formatDateBr(entry.endDate) : "—" }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
