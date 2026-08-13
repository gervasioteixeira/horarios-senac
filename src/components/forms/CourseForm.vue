<script setup lang="ts">
import { reactive, watch } from "vue"
import type { Course } from "../../types"

const props = defineProps<{
  course?: Course | null
}>()

const emit = defineEmits<{
  submit: [payload: Omit<Course, "id" | "createdAt" | "updatedAt">]
  cancel: []
}>()

function defaultState(): Omit<Course, "id" | "createdAt" | "updatedAt"> {
  return {
    name: "",
    description: "",
    totalWorkloadHours: 0,
    active: true,
  }
}

const form = reactive(defaultState())

function resetFromProp(): void {
  const c = props.course
  if (c) {
    form.name = c.name
    form.description = c.description ?? ""
    form.totalWorkloadHours = c.totalWorkloadHours
    form.active = c.active
  } else {
    Object.assign(form, defaultState())
  }
}

watch(() => props.course, resetFromProp, { immediate: true })

function handleSubmit(): void {
  if (!form.name.trim()) return
  if (!form.totalWorkloadHours || form.totalWorkloadHours <= 0) return

  emit("submit", {
    name: form.name.trim(),
    description: form.description?.trim() ? form.description.trim() : undefined,
    totalWorkloadHours: Number(form.totalWorkloadHours),
    active: form.active,
  })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="course-name">Nome *</label>
      <input
        id="course-name"
        v-model="form.name"
        type="text"
        required
        placeholder="Nome do curso"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="course-description">Descrição</label>
      <textarea
        id="course-description"
        v-model="form.description"
        rows="3"
        placeholder="opcional"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      ></textarea>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="course-workload">Carga horária total (horas) *</label>
      <input
        id="course-workload"
        v-model.number="form.totalWorkloadHours"
        type="number"
        min="1"
        step="1"
        required
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 sm:w-48"
      />
    </div>

    <div class="flex items-center gap-2">
      <input id="course-active" v-model="form.active" type="checkbox" class="h-4 w-4 rounded border-slate-300 dark:border-slate-600" />
      <label for="course-active" class="text-sm font-medium text-slate-700 dark:text-slate-300">Ativo</label>
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
