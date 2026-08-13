<script setup lang="ts">
import { reactive, watch } from "vue"
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
]

function defaultState(): Omit<Holiday, "id"> {
  return {
    date: "",
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
    form.name = h.name
    form.scope = h.scope === "national" ? "custom" : h.scope
    form.recurring = h.recurring
  } else {
    Object.assign(form, defaultState())
  }
}

watch(() => props.holiday, resetFromProp, { immediate: true })

function handleSubmit(): void {
  if (!form.date || !form.name.trim()) return

  emit("submit", {
    date: form.date,
    name: form.name.trim(),
    scope: form.scope,
    recurring: form.recurring,
  })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700" for="holiday-date">Data *</label>
        <input
          id="holiday-date"
          v-model="form.date"
          type="date"
          required
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700" for="holiday-scope">Tipo *</label>
        <select
          id="holiday-scope"
          v-model="form.scope"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          <option v-for="opt in scopeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700" for="holiday-name">Nome *</label>
      <input
        id="holiday-name"
        v-model="form.name"
        type="text"
        required
        placeholder="Ex: Aniversário da cidade"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />
    </div>

    <div class="flex items-center gap-2">
      <input id="holiday-recurring" v-model="form.recurring" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
      <label for="holiday-recurring" class="text-sm font-medium text-slate-700">
        Recorrente (repete todo ano nesta mesma data)
      </label>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <button
        type="button"
        class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Salvar
      </button>
    </div>
  </form>
</template>
