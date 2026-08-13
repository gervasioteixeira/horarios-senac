import { defineStore } from "pinia"
import { ref } from "vue"
import type { Course } from "../types"
import { LOCAL_STORAGE_KEYS, persistToLocalStorage, readFromLocalStorage } from "../composables/useLocalStorage"

function generateId(): string {
  return `course-${crypto.randomUUID()}`
}

export const useCoursesStore = defineStore("courses", () => {
  const courses = ref<Course[]>(readFromLocalStorage(LOCAL_STORAGE_KEYS.courses, []))
  persistToLocalStorage(LOCAL_STORAGE_KEYS.courses, courses)

  function create(input: Omit<Course, "id" | "createdAt" | "updatedAt">): Course {
    const now = new Date().toISOString()
    const course: Course = { ...input, id: generateId(), createdAt: now, updatedAt: now }
    courses.value.push(course)
    return course
  }

  function update(id: string, input: Partial<Omit<Course, "id" | "createdAt" | "updatedAt">>): void {
    const course = courses.value.find((c) => c.id === id)
    if (!course) return
    Object.assign(course, input, { updatedAt: new Date().toISOString() })
  }

  function remove(id: string): void {
    courses.value = courses.value.filter((c) => c.id !== id)
  }

  function getById(id: string): Course | undefined {
    return courses.value.find((c) => c.id === id)
  }

  function replaceAll(newCourses: Course[]): void {
    courses.value = newCourses
  }

  return { courses, create, update, remove, getById, replaceAll }
})
