<script setup lang="ts">
import { computed, ref } from "vue"
import { useTeachersStore } from "../stores/teachers"
import { useClassGroupsStore } from "../stores/classGroups"
import { useCoursesStore } from "../stores/courses"
import TeacherForm from "../components/forms/TeacherForm.vue"
import type { Teacher } from "../types"
import { downloadPdf, generateTeacherPdf } from "../services/pdfGenerator"

const teachersStore = useTeachersStore()
const classGroupsStore = useClassGroupsStore()
const coursesStore = useCoursesStore()

const showForm = ref(false)
const editingTeacher = ref<Teacher | null>(null)

const sortedTeachers = computed(() => {
  return [...teachersStore.teachers].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
})

function openCreateForm(): void {
  editingTeacher.value = null
  showForm.value = true
}

function openEditForm(teacher: Teacher): void {
  editingTeacher.value = teacher
  showForm.value = true
}

function closeForm(): void {
  showForm.value = false
  editingTeacher.value = null
}

function handleSubmit(payload: Omit<Teacher, "id" | "createdAt" | "updatedAt">): void {
  if (editingTeacher.value) {
    teachersStore.update(editingTeacher.value.id, payload)
  } else {
    teachersStore.create(payload)
  }
  closeForm()
}

function handleDelete(teacher: Teacher): void {
  const inUse = classGroupsStore.getByTeacherId(teacher.id).length > 0
  const message = inUse
    ? `O professor "${teacher.name}" possui turmas vinculadas. Excluir mesmo assim?`
    : `Excluir o professor "${teacher.name}"?`
  if (!window.confirm(message)) return
  teachersStore.remove(teacher.id)
}

function handleDownloadPdf(teacher: Teacher): void {
  const classGroups = classGroupsStore.getByTeacherId(teacher.id)
  const coursesById = new Map(coursesStore.courses.map((c) => [c.id, c]))
  const doc = generateTeacherPdf(teacher, classGroups, coursesById)
  downloadPdf(doc, `professor-${teacher.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-slate-800">Professores</h2>
        <p class="text-sm text-slate-500">Cadastro de professores e cor de identificação no calendário.</p>
      </div>
      <button
        type="button"
        class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        @click="openCreateForm"
      >
        + Novo professor
      </button>
    </div>

    <div v-if="showForm" class="rounded-lg border border-slate-200 bg-white p-5">
      <h3 class="mb-4 text-base font-semibold text-slate-800">
        {{ editingTeacher ? "Editar professor" : "Novo professor" }}
      </h3>
      <TeacherForm :teacher="editingTeacher" @submit="handleSubmit" @cancel="closeForm" />
    </div>

    <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table class="w-full min-w-[640px] text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3 font-medium">Cor</th>
            <th class="px-4 py-3 font-medium">Nome</th>
            <th class="px-4 py-3 font-medium">E-mail</th>
            <th class="px-4 py-3 font-medium">Telefone</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="sortedTeachers.length === 0">
            <td colspan="6" class="px-4 py-6 text-center text-slate-400">Nenhum professor cadastrado ainda.</td>
          </tr>
          <tr v-for="teacher in sortedTeachers" :key="teacher.id">
            <td class="px-4 py-3">
              <span class="inline-block h-4 w-4 rounded-full border border-slate-300" :style="{ backgroundColor: teacher.colorHex }" />
            </td>
            <td class="px-4 py-3 font-medium text-slate-800">{{ teacher.name }}</td>
            <td class="px-4 py-3 text-slate-600">{{ teacher.email || "—" }}</td>
            <td class="px-4 py-3 text-slate-600">{{ teacher.phone || "—" }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="teacher.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ teacher.active ? "Ativo" : "Inativo" }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex flex-wrap justify-end gap-x-3 gap-y-1">
                <button type="button" class="py-1 text-sm font-medium text-slate-600 hover:text-slate-900" @click="handleDownloadPdf(teacher)">
                  Baixar PDF
                </button>
                <button type="button" class="py-1 text-sm font-medium text-slate-600 hover:text-slate-900" @click="openEditForm(teacher)">
                  Editar
                </button>
                <button type="button" class="py-1 text-sm font-medium text-red-600 hover:text-red-800" @click="handleDelete(teacher)">
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
