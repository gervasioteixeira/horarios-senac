<script setup lang="ts">
import { computed, ref } from "vue"
import { useHolidaysStore } from "../stores/holidays"
import HolidayForm from "../components/forms/HolidayForm.vue"
import type { Holiday } from "../types"

const holidaysStore = useHolidaysStore()

const SCOPE_LABELS: Record<Holiday["scope"], string> = {
  national: "Nacional",
  state: "Estadual",
  municipal: "Municipal",
  custom: "Outro",
}

const showForm = ref(false)
const editingHoliday = ref<Holiday | null>(null)
const yearToGenerate = ref(new Date().getFullYear())

const nationalByYear = computed(() => {
  const map = new Map<string, Holiday[]>()
  for (const h of holidaysStore.nationalHolidays) {
    const year = h.date.slice(0, 4)
    const list = map.get(year) ?? []
    list.push(h)
    map.set(year, list)
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, holidays]) => ({
      year,
      holidays: holidays.sort((a, b) => a.date.localeCompare(b.date)),
    }))
})

const sortedCustomHolidays = computed(() => {
  return [...holidaysStore.customHolidays].sort((a, b) => a.date.localeCompare(b.date))
})

function generateForYear(): void {
  holidaysStore.ensureNationalHolidaysForYear(yearToGenerate.value)
}

function openCreateForm(): void {
  editingHoliday.value = null
  showForm.value = true
}

function closeForm(): void {
  showForm.value = false
  editingHoliday.value = null
}

function handleSubmit(payload: Omit<Holiday, "id">): void {
  // Feriados customizados não têm edição in-place na store; recria ao "editar".
  if (editingHoliday.value) {
    holidaysStore.remove(editingHoliday.value.id)
  }
  holidaysStore.create(payload)
  closeForm()
}

function openEditForm(holiday: Holiday): void {
  editingHoliday.value = holiday
  showForm.value = true
}

function handleDelete(holiday: Holiday): void {
  if (!window.confirm(`Excluir o feriado "${holiday.name}" (${holiday.date})?`)) return
  holidaysStore.remove(holiday.id)
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-")
  return `${day}/${month}/${year}`
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100">Feriados</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400">Feriados nacionais são gerados automaticamente; feriados estaduais/municipais são cadastrados manualmente.</p>
    </div>

    <section class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">Feriados nacionais</h3>
        <div class="flex items-end gap-2">
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300" for="year-to-generate">Ano</label>
            <input
              id="year-to-generate"
              v-model.number="yearToGenerate"
              type="number"
              class="w-28 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            type="button"
            class="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="generateForYear"
          >
            Gerar feriados para o ano {{ yearToGenerate }}
          </button>
        </div>
      </div>

      <div v-if="nationalByYear.length === 0" class="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
        Nenhum feriado nacional gerado ainda.
      </div>

      <div v-for="group in nationalByYear" :key="group.year" class="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <h4 class="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{{ group.year }}</h4>
        <table class="w-full min-w-[420px] text-left text-sm">
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr v-for="h in group.holidays" :key="h.id">
              <td class="px-4 py-2 text-slate-600 dark:text-slate-300">{{ formatDate(h.date) }}</td>
              <td class="px-4 py-2 text-slate-800 dark:text-slate-100">{{ h.name }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">Feriados customizados</h3>
        <button
          type="button"
          class="rounded-md bg-[#0050a0] px-4 py-2 text-sm font-medium text-white hover:bg-[#003d7a] dark:bg-[#1a6fc4] dark:hover:bg-[#0050a0]"
          @click="openCreateForm"
        >
          + Novo feriado
        </button>
      </div>

      <div v-if="showForm" class="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h4 class="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
          {{ editingHoliday ? "Editar feriado" : "Novo feriado" }}
        </h4>
        <HolidayForm :holiday="editingHoliday" @submit="handleSubmit" @cancel="closeForm" />
      </div>

      <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <table class="w-full min-w-[560px] text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th class="px-4 py-3 font-medium">Data</th>
              <th class="px-4 py-3 font-medium">Nome</th>
              <th class="px-4 py-3 font-medium">Tipo</th>
              <th class="px-4 py-3 font-medium">Recorrente</th>
              <th class="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr v-if="sortedCustomHolidays.length === 0">
              <td colspan="5" class="px-4 py-6 text-center text-slate-400 dark:text-slate-500">Nenhum feriado customizado cadastrado ainda.</td>
            </tr>
            <tr v-for="h in sortedCustomHolidays" :key="h.id">
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ formatDate(h.date) }}</td>
              <td class="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{{ h.name }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ SCOPE_LABELS[h.scope] }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ h.recurring ? "Sim" : "Não" }}</td>
              <td class="px-4 py-3 text-right">
                <div class="flex flex-wrap justify-end gap-x-3 gap-y-1">
                  <button type="button" class="py-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100" @click="openEditForm(h)">
                    Editar
                  </button>
                  <button type="button" class="py-1 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" @click="handleDelete(h)">
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
