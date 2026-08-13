<script setup lang="ts">
import { reactive, watch } from "vue"
import type { Room } from "../../types"

const props = defineProps<{
  room?: Room | null
}>()

const emit = defineEmits<{
  submit: [payload: Omit<Room, "id" | "createdAt" | "updatedAt">]
  cancel: []
}>()

function defaultState(): Omit<Room, "id" | "createdAt" | "updatedAt"> {
  return {
    name: "",
    location: "",
    capacity: 0,
    active: true,
  }
}

const form = reactive(defaultState())

function resetFromProp(): void {
  const r = props.room
  if (r) {
    form.name = r.name
    form.location = r.location ?? ""
    form.capacity = r.capacity
    form.active = r.active
  } else {
    Object.assign(form, defaultState())
  }
}

watch(() => props.room, resetFromProp, { immediate: true })

function handleSubmit(): void {
  if (!form.name.trim()) return
  if (!form.capacity || form.capacity <= 0) return

  emit("submit", {
    name: form.name.trim(),
    location: form.location?.trim() ? form.location.trim() : undefined,
    capacity: Number(form.capacity),
    active: form.active,
  })
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="handleSubmit">
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700" for="room-name">Nome do espaço *</label>
      <input
        id="room-name"
        v-model="form.name"
        type="text"
        required
        placeholder='Ex: "Sala 3" ou "Laboratório de Informática 1"'
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700" for="room-location">Localização</label>
      <input
        id="room-location"
        v-model="form.location"
        type="text"
        placeholder='opcional, ex: "Bloco A, 2º andar"'
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700" for="room-capacity">Capacidade (nº de alunos) *</label>
      <input
        id="room-capacity"
        v-model.number="form.capacity"
        type="number"
        min="1"
        step="1"
        required
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none sm:w-48"
      />
    </div>

    <div class="flex items-center gap-2">
      <input id="room-active" v-model="form.active" type="checkbox" class="h-4 w-4 rounded border-slate-300" />
      <label for="room-active" class="text-sm font-medium text-slate-700">Ativo</label>
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
