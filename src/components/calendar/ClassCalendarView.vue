<script setup lang="ts">
import { computed, ref } from "vue"
import { useClassGroupsStore } from "../../stores/classGroups"
import { useTeachersStore } from "../../stores/teachers"

const classGroupsStore = useClassGroupsStore()
const teachersStore = useTeachersStore()

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth() + 1) // 1-12

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const WEEKDAY_HEADER = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function previousMonth(): void {
  if (viewMonth.value === 1) {
    viewMonth.value = 12
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function nextMonth(): void {
  if (viewMonth.value === 12) {
    viewMonth.value = 1
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

function goToToday(): void {
  viewYear.value = today.getFullYear()
  viewMonth.value = today.getMonth() + 1
}

interface DayCell {
  day: number
  iso: string
  inCurrentMonth: boolean
}

/** Eventos (turma com aula) indexados por data ISO "YYYY-MM-DD". */
const eventsByDate = computed(() => {
  const map = new Map<string, Array<{ classGroupId: string; name: string; colorHex: string }>>()
  for (const cg of classGroupsStore.classGroups) {
    if (cg.status === "cancelled") continue
    const teacher = teachersStore.getById(cg.teacherId)
    const colorHex = teacher?.colorHex ?? "#64748b"
    for (const date of cg.computedClassDates) {
      const list = map.get(date) ?? []
      list.push({ classGroupId: cg.id, name: cg.name, colorHex })
      map.set(date, list)
    }
  }
  return map
})

const calendarCells = computed<DayCell[]>(() => {
  const year = viewYear.value
  const month = viewMonth.value // 1-12
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1))
  const firstWeekday = firstOfMonth.getUTCDay() // 0=domingo
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()

  const cells: DayCell[] = []

  // Dias do mês anterior para preencher a primeira semana
  const daysInPrevMonth = new Date(Date.UTC(year, month - 1, 0)).getUTCDate()
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    cells.push({ day, iso: `${prevYear}-${pad2(prevMonth)}-${pad2(day)}`, inCurrentMonth: false })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, iso: `${year}-${pad2(month)}-${pad2(day)}`, inCurrentMonth: true })
  }

  // Completa até fechar semanas de 7 dias
  const remainder = cells.length % 7
  if (remainder !== 0) {
    const nextMonthNum = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    for (let day = 1; day <= 7 - remainder; day++) {
      cells.push({ day, iso: `${nextYear}-${pad2(nextMonthNum)}-${pad2(day)}`, inCurrentMonth: false })
    }
  }

  return cells
})

function eventsFor(iso: string) {
  return eventsByDate.value.get(iso) ?? []
}

const monthLabel = computed(() => `${MONTH_NAMES[viewMonth.value - 1]} de ${viewYear.value}`)
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-base font-semibold text-slate-800">{{ monthLabel }}</h3>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          @click="previousMonth"
        >
          &larr; Anterior
        </button>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          @click="goToToday"
        >
          Hoje
        </button>
        <button
          type="button"
          class="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          @click="nextMonth"
        >
          Próximo &rarr;
        </button>
      </div>
    </div>

    <div class="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 text-xs">
      <div v-for="wd in WEEKDAY_HEADER" :key="wd" class="bg-slate-50 px-2 py-1.5 text-center font-medium text-slate-500">
        {{ wd }}
      </div>

      <div
        v-for="cell in calendarCells"
        :key="cell.iso"
        class="min-h-[92px] bg-white p-1.5"
        :class="{ 'bg-slate-50 text-slate-400': !cell.inCurrentMonth }"
      >
        <div class="mb-1 text-right text-[11px]" :class="cell.inCurrentMonth ? 'text-slate-500' : 'text-slate-300'">
          {{ cell.day }}
        </div>
        <div class="flex flex-col gap-1">
          <div
            v-for="event in eventsFor(cell.iso)"
            :key="event.classGroupId"
            class="truncate rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
            :style="{ backgroundColor: event.colorHex }"
            :title="event.name"
          >
            {{ event.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
