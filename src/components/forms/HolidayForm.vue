<script setup lang="ts">
import { computed, reactive, watch } from "vue"
import type { Holiday, HolidayScope } from "../../types"

const props = defineProps<{
  holiday?: Holiday | null
}>()

const emit = defineEmits<{
  submit: [payload: Omit<Holiday, "id">]
  cancel: []
}>()

const scopeOptions: Array<{ value: Exclude<HolidayScope, "national">; label: string }> = [
  { value: "state", label: "Estadual" },
  { value: "municipal", label: "Municipal" },
  { value: "custom", label: "Ponto facultativo / outro" },
  { value: "recess", label: "Recesso escolar (período)" },
]

function defaultState(): Omit<Holiday, "id"> {
  return {
    date: "",
    endDate: "",
    name: "",
    scope: "custom",
    recurring: false,
  }
}

const form = reactive(defaultState())

function resetFromProp(): void {
  const h = props.holiday
  if (h) {
    form.date = h.date
    form.endDate = h.endDate ?? ""
    form.name = h.name
    form.scope = h.scope === "national" ? "custom" : h.scope
    form.recurring = h.recurring
  } else {
    Object.assign(form, defaultState())
  }
}

watch(() => props.holiday, resetFromProp, { immediate: true })

const isRecess = computed(() => form.scope === "recess")

const recessRangeInvalid = computed(() => isRecess.value && (!form.endDate || form.endDate < form.date))

function handleSubmit(): void {
  if (!form.date || !form.name.trim()) return
  if (recessRangeInvalid.value) return

  emit("submit", {
    date: form.date,
    endDate: isRecess.value ? form.endDate : undefined,
    name: form.name.trim(),
    scope: form.scope,
    // Recesso é um período único, não se repete automaticamente todo ano.
    recurring: isRecess.value ? false : form.recurring,
  })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="holiday-date">{{ isRecess ? "Primeiro dia do recesso *" : "Data *" }}</label>
        <input
          id="holiday-date"
          v-model="form.date"
          type="date"
          required
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="holiday-scope">Tipo *</label>
        <select
          id="holiday-scope"
          v-model="form.scope"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        >
          <option v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="isRecess" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="holiday-end-date">Último dia do recesso *</label>
        <input
          id="holiday-end-date"
          v-model="form.endDate"
          type="date"
          required
          :min="form.date || undefined"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
        <p v-if="recessRangeInvalid && form.endDate" class="mt-1 text-xs text-red-600 dark:text-red-400">O último dia não pode ser anterior ao primeiro.</p>
      </div>
      <p class="self-end text-xs text-slate-500 dark:text-slate-400">
        O recesso só afeta cursos de Aprendizagem: durante o período não há teoria e a semana toda (seg–sex) vira prática.
      </p>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="holiday-name">Nome *</label>
      <input
        id="holiday-name"
        v-model="form.name"
        type="text"
        required
        placeholder="Ex: Aniversário da cidade"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>

    <div v-if="!isRecess" class="flex items-center gap-2">
      <input id="holiday-recurring" v-model="form.recurring" type="checkbox" class="h-4 w-4 rounded border-slate-300 dark:border-slate-600" />
      <label for="holiday-recurring" class="text-sm font-medium text-slate-700 dark:text-slate-300">
        Recorrente (repete todo ano nesta mesma data)
      </label>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <button
        type="button"
        class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="rounded-md bg-[#0050a0] px-4 py-2 text-sm font-medium text-white hover:bg-[#003d7a] dark:bg-[#1a6fc4] dark:hover:bg-[#0050a0]"
      >
        Salvar
      </button>
    </div>
  </form>
</template>
