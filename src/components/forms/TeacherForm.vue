<script setup lang="ts">
import { reactive, watch } from "vue"
import type { Teacher } from "../../types"

const props = defineProps<{
  teacher?: Teacher | null
}>()

const emit = defineEmits<{
  submit: [payload: Omit<Teacher, "id" | "createdAt" | "updatedAt">]
  cancel: []
}>()

function defaultState(): Omit<Teacher, "id" | "createdAt" | "updatedAt"> {
  return {
    name: "",
    email: "",
    phone: "",
    colorHex: "#3b82f6",
    active: true,
  }
}

const form = reactive(defaultState())

function resetFromProp(): void {
  const t = props.teacher
  if (t) {
    form.name = t.name
    form.email = t.email ?? ""
    form.phone = t.phone ?? ""
    form.colorHex = t.colorHex
    form.active = t.active
  } else {
    Object.assign(form, defaultState())
  }
}

watch(() => props.teacher, resetFromProp, { immediate: true })

const hexColorPattern = /^#[0-9a-fA-F]{6}$/

function isValidColor(value: string): boolean {
  return hexColorPattern.test(value)
}

function handleSubmit(): void {
  if (!form.name.trim()) return
  if (!isValidColor(form.colorHex)) return

  emit("submit", {
    name: form.name.trim(),
    email: form.email?.trim() ? form.email.trim() : undefined,
    phone: form.phone?.trim() ? form.phone.trim() : undefined,
    colorHex: form.colorHex,
    active: form.active,
  })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="teacher-name">Nome *</label>
      <input
        id="teacher-name"
        v-model="form.name"
        type="text"
        required
        placeholder="Nome completo do professor"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="teacher-email">E-mail</label>
        <input
          id="teacher-email"
          v-model="form.email"
          type="email"
          placeholder="opcional"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="teacher-phone">Telefone</label>
        <input
          id="teacher-phone"
          v-model="form.phone"
          type="text"
          placeholder="opcional"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="teacher-color">Cor de identificação</label>
      <div class="flex items-center gap-3">
        <input
          id="teacher-color"
          v-model="form.colorHex"
          type="color"
          class="h-10 w-14 cursor-pointer rounded border border-slate-300 p-1 dark:border-slate-600"
        />
        <input
          v-model="form.colorHex"
          type="text"
          placeholder="#3b82f6"
          maxlength="7"
          class="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          :class="{ 'border-red-400 dark:border-red-500': form.colorHex && !isValidColor(form.colorHex) }"
        />
        <span
          v-if="form.colorHex && !isValidColor(form.colorHex)"
          class="text-xs text-red-600 dark:text-red-400"
        >Formato inválido (use #rrggbb)</span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <input id="teacher-active" v-model="form.active" type="checkbox" class="h-4 w-4 rounded border-slate-300 dark:border-slate-600" />
      <label for="teacher-active" class="text-sm font-medium text-slate-700 dark:text-slate-300">Ativo</label>
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
