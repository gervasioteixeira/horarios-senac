<script setup lang="ts">
import { computed, ref } from "vue"
import { useClassGroupsStore } from "../stores/classGroups"
import { useCoursesStore } from "../stores/courses"
import { useTeachersStore } from "../stores/teachers"
import { useRoomsStore } from "../stores/rooms"
import ClassGroupForm from "../components/forms/ClassGroupForm.vue"
import ClassCalendarView from "../components/calendar/ClassCalendarView.vue"
import type { ClassGroup } from "../types"
import { timeSlotLabel } from "../constants/schedule"
import { downloadPdf, generateClassGroupPdf } from "../services/pdfGenerator"

const classGroupsStore = useClassGroupsStore()
const coursesStore = useCoursesStore()
const teachersStore = useTeachersStore()
const roomsStore = useRoomsStore()

const showForm = ref(false)
const editingClassGroup = ref<ClassGroup | null>(null)

const STATUS_LABELS: Record<ClassGroup["status"], string> = {
  planned: "Planejada",
  ongoing: "Em andamento",
  finished: "Concluída",
  cancelled: "Cancelada",
}

const STATUS_CLASSES: Record<ClassGroup["status"], string> = {
  planned: "bg-sky-100 text-sky-700",
  ongoing: "bg-emerald-100 text-emerald-700",
  finished: "bg-slate-100 text-slate-500",
  cancelled: "bg-red-100 text-red-700",
}

const sortedClassGroups = computed(() => {
  return [...classGroupsStore.classGroups].sort((a, b) => b.startDate.localeCompare(a.startDate))
})

function courseName(courseId: string): string {
  return coursesStore.getById(courseId)?.name ?? "Curso removido"
}

function teacherOf(teacherId: string) {
  return teachersStore.getById(teacherId)
}

function roomName(roomId: string | undefined): string {
  if (!roomId) return "—"
  return roomsStore.getById(roomId)?.name ?? "Espaço removido"
}

function openCreateForm(): void {
  editingClassGroup.value = null
  showForm.value = true
}

function openEditForm(classGroup: ClassGroup): void {
  editingClassGroup.value = classGroup
  showForm.value = true
}

function closeForm(): void {
  showForm.value = false
  editingClassGroup.value = null
}

function handleSaved(): void {
  closeForm()
}

function handleDelete(classGroup: ClassGroup): void {
  if (!window.confirm(`Excluir a turma "${classGroup.name}"?`)) return
  classGroupsStore.remove(classGroup.id)
}

function handleDownloadPdf(classGroup: ClassGroup): void {
  const course = coursesStore.getById(classGroup.courseId)
  const teacher = teachersStore.getById(classGroup.teacherId)
  if (!course || !teacher) {
    window.alert("Não foi possível gerar o PDF: curso ou professor não encontrado.")
    return
  }
  const room = classGroup.roomId ? roomsStore.getById(classGroup.roomId) : undefined
  const doc = generateClassGroupPdf(classGroup, course, teacher, room)
  downloadPdf(doc, `turma-${classGroup.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-slate-800">Turmas</h2>
        <p class="text-sm text-slate-500">Cadastro de turmas, cálculo automático de calendário e checagem de conflitos.</p>
      </div>
      <button
        type="button"
        class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        @click="openCreateForm"
      >
        + Nova turma
      </button>
    </div>

    <div v-if="showForm" class="rounded-lg border border-slate-200 bg-white p-5">
      <h3 class="mb-4 text-base font-semibold text-slate-800">
        {{ editingClassGroup ? "Editar turma" : "Nova turma" }}
      </h3>
      <ClassGroupForm :class-group="editingClassGroup" @saved="handleSaved" @cancel="closeForm" />
    </div>

    <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table class="w-full min-w-[980px] text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3 font-medium">Turma</th>
            <th class="px-4 py-3 font-medium">Curso</th>
            <th class="px-4 py-3 font-medium">Professor</th>
            <th class="px-4 py-3 font-medium">Espaço</th>
            <th class="px-4 py-3 font-medium">Período</th>
            <th class="px-4 py-3 font-medium">Faixa</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="sortedClassGroups.length === 0">
            <td colspan="8" class="px-4 py-6 text-center text-slate-400">Nenhuma turma cadastrada ainda.</td>
          </tr>
          <tr v-for="cg in sortedClassGroups" :key="cg.id">
            <td class="px-4 py-3 font-medium text-slate-800">{{ cg.name }}</td>
            <td class="px-4 py-3 text-slate-600">{{ courseName(cg.courseId) }}</td>
            <td class="px-4 py-3 text-slate-600">
              <div class="flex items-center gap-1.5">
                <span
                  class="inline-block h-3 w-3 rounded-full border border-slate-300"
                  :style="{ backgroundColor: teacherOf(cg.teacherId)?.colorHex ?? '#94a3b8' }"
                />
                {{ teacherOf(cg.teacherId)?.name ?? "Professor removido" }}
              </div>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ roomName(cg.roomId) }}</td>
            <td class="px-4 py-3 text-slate-600">
              {{ cg.startDate }} — {{ cg.computedEndDate ?? "?" }}
            </td>
            <td class="px-4 py-3 text-slate-600">{{ timeSlotLabel(cg.timeSlot) }}</td>
            <td class="px-4 py-3">
              <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="STATUS_CLASSES[cg.status]">
                {{ STATUS_LABELS[cg.status] }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex flex-wrap justify-end gap-x-3 gap-y-1">
                <button
                  type="button"
                  class="py-1 text-sm font-medium text-slate-600 hover:text-slate-900"
                  @click="handleDownloadPdf(cg)"
                >
                  Baixar PDF
                </button>
                <button type="button" class="py-1 text-sm font-medium text-slate-600 hover:text-slate-900" @click="openEditForm(cg)">
                  Editar
                </button>
                <button type="button" class="py-1 text-sm font-medium text-red-600 hover:text-red-800" @click="handleDelete(cg)">
                  Excluir
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ClassCalendarView />
  </div>
</template>
