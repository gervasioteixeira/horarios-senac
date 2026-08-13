<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoomsStore } from "../stores/rooms"
import { useClassGroupsStore } from "../stores/classGroups"
import RoomForm from "../components/forms/RoomForm.vue"
import type { Room } from "../types"

const roomsStore = useRoomsStore()
const classGroupsStore = useClassGroupsStore()

const showForm = ref(false)
const editingRoom = ref<Room | null>(null)

const sortedRooms = computed(() => {
  return [...roomsStore.rooms].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
})

function openCreateForm(): void {
  editingRoom.value = null
  showForm.value = true
}

function openEditForm(room: Room): void {
  editingRoom.value = room
  showForm.value = true
}

function closeForm(): void {
  showForm.value = false
  editingRoom.value = null
}

function handleSubmit(payload: Omit<Room, "id" | "createdAt" | "updatedAt">): void {
  if (editingRoom.value) {
    roomsStore.update(editingRoom.value.id, payload)
  } else {
    roomsStore.create(payload)
  }
  closeForm()
}

function isRoomInUse(roomId: string): boolean {
  return classGroupsStore.getByRoomId(roomId).length > 0
}

function handleDelete(room: Room): void {
  const message = isRoomInUse(room.id)
    ? `O espaço "${room.name}" possui turmas vinculadas. Excluir mesmo assim?`
    : `Excluir o espaço "${room.name}"?`
  if (!window.confirm(message)) return
  roomsStore.remove(room.id)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-slate-800">Espaços</h2>
        <p class="text-sm text-slate-500">Salas, laboratórios e demais espaços físicos disponíveis para alocação de turmas.</p>
      </div>
      <button
        type="button"
        class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        @click="openCreateForm"
      >
        + Novo espaço
      </button>
    </div>

    <div v-if="showForm" class="rounded-lg border border-slate-200 bg-white p-5">
      <h3 class="mb-4 text-base font-semibold text-slate-800">
        {{ editingRoom ? "Editar espaço" : "Novo espaço" }}
      </h3>
      <RoomForm :room="editingRoom" @submit="handleSubmit" @cancel="closeForm" />
    </div>

    <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table class="w-full min-w-[640px] text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3 font-medium">Nome</th>
            <th class="px-4 py-3 font-medium">Localização</th>
            <th class="px-4 py-3 font-medium">Capacidade</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="sortedRooms.length === 0">
            <td colspan="5" class="px-4 py-6 text-center text-slate-400">Nenhum espaço cadastrado ainda.</td>
          </tr>
          <tr v-for="room in sortedRooms" :key="room.id">
            <td class="px-4 py-3 font-medium text-slate-800">{{ room.name }}</td>
            <td class="px-4 py-3 text-slate-600">{{ room.location || "—" }}</td>
            <td class="px-4 py-3 text-slate-600">{{ room.capacity }} aluno(s)</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="room.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ room.active ? "Ativo" : "Inativo" }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex flex-wrap justify-end gap-x-3 gap-y-1">
                <button type="button" class="py-1 text-sm font-medium text-slate-600 hover:text-slate-900" @click="openEditForm(room)">
                  Editar
                </button>
                <button type="button" class="py-1 text-sm font-medium text-red-600 hover:text-red-800" @click="handleDelete(room)">
                  Excluir
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
