import { defineStore } from "pinia"
import { ref } from "vue"
import type { Room } from "../types"
import { LOCAL_STORAGE_KEYS, persistToLocalStorage, readFromLocalStorage } from "../composables/useLocalStorage"

function generateId(): string {
  return `room-${crypto.randomUUID()}`
}

export const useRoomsStore = defineStore("rooms", () => {
  const rooms = ref<Room[]>(readFromLocalStorage(LOCAL_STORAGE_KEYS.rooms, []))
  persistToLocalStorage(LOCAL_STORAGE_KEYS.rooms, rooms)

  function create(input: Omit<Room, "id" | "createdAt" | "updatedAt">): Room {
    const now = new Date().toISOString()
    const room: Room = { ...input, id: generateId(), createdAt: now, updatedAt: now }
    rooms.value.push(room)
    return room
  }

  function update(id: string, input: Partial<Omit<Room, "id" | "createdAt" | "updatedAt">>): void {
    const room = rooms.value.find((r) => r.id === id)
    if (!room) return
    Object.assign(room, input, { updatedAt: new Date().toISOString() })
  }

  function remove(id: string): void {
    rooms.value = rooms.value.filter((r) => r.id !== id)
  }

  function getById(id: string): Room | undefined {
    return rooms.value.find((r) => r.id === id)
  }

  function replaceAll(newRooms: Room[]): void {
    rooms.value = newRooms
  }

  return { rooms, create, update, remove, getById, replaceAll }
})
