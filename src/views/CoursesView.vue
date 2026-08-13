<script setup lang="ts">
import { computed, ref } from "vue"
import { useCoursesStore } from "../stores/courses"
import { useClassGroupsStore } from "../stores/classGroups"
import CourseForm from "../components/forms/CourseForm.vue"
import type { Course } from "../types"

const coursesStore = useCoursesStore()
const classGroupsStore = useClassGroupsStore()

const showForm = ref(false)
const editingCourse = ref<Course | null>(null)

const sortedCourses = computed(() => {
  return [...coursesStore.courses].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
})

function openCreateForm(): void {
  editingCourse.value = null
  showForm.value = true
}

function openEditForm(course: Course): void {
  editingCourse.value = course
  showForm.value = true
}

function closeForm(): void {
  showForm.value = false
  editingCourse.value = null
}

function handleSubmit(payload: Omit<Course, "id" | "createdAt" | "updatedAt">): void {
  if (editingCourse.value) {
    coursesStore.update(editingCourse.value.id, payload)
  } else {
    coursesStore.create(payload)
  }
  closeForm()
}

function isCourseInUse(courseId: string): boolean {
  return classGroupsStore.classGroups.some((cg) => cg.courseId === courseId)
}

function handleDelete(course: Course): void {
  const message = isCourseInUse(course.id)
    ? `O curso "${course.name}" possui turmas vinculadas. Excluir mesmo assim?`
    : `Excluir o curso "${course.name}"?`
  if (!window.confirm(message)) return
  coursesStore.remove(course.id)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-100">Cursos</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400">Cadastro de cursos e carga horária total.</p>
      </div>
      <button
        type="button"
        class="rounded-md bg-[#0050a0] px-4 py-2 text-sm font-medium text-white hover:bg-[#003d7a] dark:bg-[#1a6fc4] dark:hover:bg-[#0050a0]"
        @click="openCreateForm"
      >
        + Novo curso
      </button>
    </div>

    <div v-if="showForm" class="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <h3 class="mb-4 text-base font-semibold text-slate-800 dark:text-slate-100">
        {{ editingCourse ? "Editar curso" : "Novo curso" }}
      </h3>
      <CourseForm :course="editingCourse" @submit="handleSubmit" @cancel="closeForm" />
    </div>

    <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <table class="w-full min-w-[640px] text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          <tr>
            <th class="px-4 py-3 font-medium">Nome</th>
            <th class="px-4 py-3 font-medium">Descrição</th>
            <th class="px-4 py-3 font-medium">Carga horária</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
          <tr v-if="sortedCourses.length === 0">
            <td colspan="5" class="px-4 py-6 text-center text-slate-400 dark:text-slate-500">Nenhum curso cadastrado ainda.</td>
          </tr>
          <tr v-for="course in sortedCourses" :key="course.id">
            <td class="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{{ course.name }}</td>
            <td class="px-4 py-3 max-w-xs truncate text-slate-600 dark:text-slate-300" :title="course.description">{{ course.description || "—" }}</td>
            <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ course.totalWorkloadHours }}h</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="course.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'"
              >
                {{ course.active ? "Ativo" : "Inativo" }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex flex-wrap justify-end gap-x-3 gap-y-1">
                <button type="button" class="py-1 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100" @click="openEditForm(course)">
                  Editar
                </button>
                <button type="button" class="py-1 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" @click="handleDelete(course)">
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
