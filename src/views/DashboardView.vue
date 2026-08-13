<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { useTeachersStore } from "../stores/teachers"
import { useCoursesStore } from "../stores/courses"
import { useClassGroupsStore } from "../stores/classGroups"
import { timeSlotLabel } from "../constants/schedule"

const teachersStore = useTeachersStore()
const coursesStore = useCoursesStore()
const classGroupsStore = useClassGroupsStore()

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Início (domingo) e fim (sábado) da semana corrente, em datas locais. */
const weekRange = computed(() => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
  return { start: toIsoDate(start), end: toIsoDate(end) }
})

const activeClassGroupsCount = computed(() => {
  return classGroupsStore.classGroups.filter((cg) => cg.status === "ongoing" || cg.status === "planned").length
})

interface UpcomingClass {
  classGroupId: string
  classGroupName: string
  courseName: string
  teacherName: string
  teacherColor: string
  date: string
  timeSlotText: string
}

const upcomingThisWeek = computed<UpcomingClass[]>(() => {
  const { start, end } = weekRange.value
  const result: UpcomingClass[] = []

  for (const cg of classGroupsStore.classGroups) {
    if (cg.status === "cancelled") continue
    const teacher = teachersStore.getById(cg.teacherId)
    const course = coursesStore.getById(cg.courseId)
    for (const date of cg.computedClassDates) {
      if (date >= start && date <= end) {
        result.push({
          classGroupId: cg.id,
          classGroupName: cg.name,
          courseName: course?.name ?? "Curso removido",
          teacherName: teacher?.name ?? "Professor removido",
          teacherColor: teacher?.colorHex ?? "#94a3b8",
          date,
          timeSlotText: timeSlotLabel(cg.timeSlot),
        })
      }
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date))
})

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-")
  return `${day}/${month}/${year}`
}

const stats = computed(() => [
  { label: "Professores", value: teachersStore.teachers.length, to: "/professores" },
  { label: "Cursos", value: coursesStore.courses.length, to: "/cursos" },
  { label: "Turmas ativas", value: activeClassGroupsCount.value, to: "/turmas" },
])
</script>

<template>
  <div class="space-y-8">
    <div>
      <h2 class="text-xl font-semibold text-slate-800">Painel</h2>
      <p class="text-sm text-slate-500">Visão geral do sistema de horários.</p>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <RouterLink
        v-for="stat in stats"
        :key="stat.label"
        :to="stat.to"
        class="rounded-lg border border-slate-200 bg-white p-5 hover:border-slate-400"
      >
        <p class="text-sm text-slate-500">{{ stat.label }}</p>
        <p class="mt-1 text-3xl font-semibold text-slate-900">{{ stat.value }}</p>
      </RouterLink>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-5">
      <h3 class="mb-4 text-base font-semibold text-slate-800">Próximas aulas desta semana</h3>
      <div v-if="upcomingThisWeek.length === 0" class="py-6 text-center text-sm text-slate-400">
        Nenhuma aula prevista para esta semana.
      </div>
      <ul v-else class="divide-y divide-slate-100">
        <li v-for="(item, idx) in upcomingThisWeek" :key="`${item.classGroupId}-${item.date}-${idx}`" class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <span class="inline-block h-3 w-3 rounded-full border border-slate-300" :style="{ backgroundColor: item.teacherColor }" />
            <div>
              <p class="text-sm font-medium text-slate-800">{{ item.classGroupName }}</p>
              <p class="text-xs text-slate-500">{{ item.courseName }} · {{ item.teacherName }}</p>
            </div>
          </div>
          <div class="text-right text-xs text-slate-500">
            <p class="font-medium text-slate-700">{{ formatDate(item.date) }}</p>
            <p>{{ item.timeSlotText }}</p>
          </div>
        </li>
      </ul>
    </div>

    <div class="rounded-lg border border-slate-200 bg-white p-5">
      <h3 class="mb-4 text-base font-semibold text-slate-800">Atalhos</h3>
      <div class="flex flex-wrap gap-3">
        <RouterLink to="/turmas" class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          Gerenciar turmas
        </RouterLink>
        <RouterLink to="/cursos" class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          Gerenciar cursos
        </RouterLink>
        <RouterLink to="/professores" class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          Gerenciar professores
        </RouterLink>
        <RouterLink to="/feriados" class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          Gerenciar feriados
        </RouterLink>
      </div>
    </div>
  </div>
</template>
