import { defineStore } from "pinia"
import { ref } from "vue"
import type { Teacher } from "../types"
import { LOCAL_STORAGE_KEYS, persistToLocalStorage, readFromLocalStorage } from "../composables/useLocalStorage"

function generateId(): string {
  return `teacher-${crypto.randomUUID()}`
}

export const useTeachersStore = defineStore("teachers", () => {
  const teachers = ref<Teacher[]>(readFromLocalStorage(LOCAL_STORAGE_KEYS.teachers, []))
  persistToLocalStorage(LOCAL_STORAGE_KEYS.teachers, teachers)

  function create(input: Omit<Teacher, "id" | "createdAt" | "updatedAt">): Teacher {
    const now = new Date().toISOString()
    const teacher: Teacher = { ...input, id: generateId(), createdAt: now, updatedAt: now }
    teachers.value.push(teacher)
    return teacher
  }

  function update(id: string, input: Partial<Omit<Teacher, "id" | "createdAt" | "updatedAt">>): void {
    const teacher = teachers.value.find((t) => t.id === id)
    if (!teacher) return
    Object.assign(teacher, input, { updatedAt: new Date().toISOString() })
  }

  function remove(id: string): void {
    teachers.value = teachers.value.filter((t) => t.id !== id)
  }

  function getById(id: string): Teacher | undefined {
    return teachers.value.find((t) => t.id === id)
  }

  function replaceAll(newTeachers: Teacher[]): void {
    teachers.value = newTeachers
  }

  return { teachers, create, update, remove, getById, replaceAll }
})
