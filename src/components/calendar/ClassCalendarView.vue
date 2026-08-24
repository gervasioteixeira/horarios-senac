<script setup lang="ts">
import { computed, ref } from "vue"
import { useClassGroupsStore } from "../../stores/classGroups"
import { useTeachersStore } from "../../stores/teachers"
import { useRoomsStore } from "../../stores/rooms"
import { useCoursesStore } from "../../stores/courses"
import { timeSlotLabel } from "../../constants/schedule"
import type { ScheduleConflict, CapacityConflict } from "../../services/conflictChecker"
import RescheduleActionModal from "../shared/RescheduleActionModal.vue"
import RescheduleConfirmModal from "../shared/RescheduleConfirmModal.vue"
import RescheduleConflictModal from "../shared/RescheduleConflictModal.vue"

const classGroupsStore = useClassGroupsStore()
const teachersStore = useTeachersStore()
const roomsStore = useRoomsStore()
const coursesStore = useCoursesStore()

type ViewMode = "day" | "week" | "month" | "semester" | "year"

const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
  semester: "Semestre",
  year: "Ano",
}

const VIEW_MODES: ViewMode[] = ["day", "week", "month", "semester", "year"]

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const MONTH_SHORT_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
]

const WEEKDAY_HEADER = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const viewMode = ref<ViewMode>("month")
/** Data de referência da visão atual (qualquer dia dentro do período mostrado). */
const referenceDate = ref(new Date())

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function addMonths(date: Date, amount: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + amount)
  return result
}

/** Eventos (turma com aula) indexados por data ISO "YYYY-MM-DD". */
const eventsByDate = computed(() => {
  const map = new Map<
    string,
    Array<{ classGroupId: string; name: string; colorHex: string; courseName: string; teacherName: string; timeSlotText: string; roomName: string | null }>
  >()
  for (const cg of classGroupsStore.classGroups) {
    if (cg.status === "cancelled") continue
    const teacher = teachersStore.getById(cg.teacherId)
    const colorHex = teacher?.colorHex ?? "#64748b"
    const courseName = coursesStore.getById(cg.courseId)?.name ?? "Curso removido"
    const roomName = cg.roomId ? (roomsStore.getById(cg.roomId)?.name ?? "Espaço removido") : null
    for (const date of cg.computedClassDates) {
      const list = map.get(date) ?? []
      list.push({
        classGroupId: cg.id,
        name: cg.name,
        colorHex,
        courseName,
        teacherName: teacher?.name ?? "Professor removido",
        timeSlotText: timeSlotLabel(cg.timeSlot),
        roomName,
      })
      map.set(date, list)
    }
  }
  return map
})

function eventsFor(iso: string) {
  return eventsByDate.value.get(iso) ?? []
}

/** Texto do tooltip nativo (title) ao passar o mouse sobre uma aula no calendário. */
function eventTooltip(event: { name: string; courseName: string; teacherName: string; roomName: string | null }): string {
  const lines = [event.name, event.courseName, event.teacherName]
  if (event.roomName) lines.push(event.roomName)
  return lines.join("\n")
}

// ---------- Reagendar aula: tocar/clicar numa aula (só nas visões Semana e Mês) ----------
// Usa toque/clique + seletor de data em vez de arrastar-e-soltar (HTML5 Drag and Drop
// não funciona em touchscreens) para que a funcionalidade seja operável no celular/tablet.

interface ActionTarget {
  classGroupId: string
  eventName: string
  courseName: string
  /** Data original (ISO) da aula tocada. */
  fromDate: string
}

/** Aula tocada, aguardando o usuário escolher modo + nova data no RescheduleActionModal. */
const actionTarget = ref<ActionTarget | null>(null)
/** Aguardando confirmação de antecipação de curso (modal) — só se aplica ao modo "turma inteira". */
const pendingAdvanceConfirmation = ref<{ classGroupId: string; fromDate: string; toDate: string; proposedStartDate: string } | null>(null)
/** Conflito detectado ao tentar aplicar o reagendamento (modal). */
const rescheduleConflict = ref<{ conflict?: ScheduleConflict; capacityConflict?: CapacityConflict } | null>(null)
/** Aviso simples de ação inválida (ex: adiamento pontual escolhido para uma data não posterior). */
const rescheduleWarning = ref<string | null>(null)

function onEventTap(event: { classGroupId: string; name: string; courseName: string }, fromDate: string): void {
  actionTarget.value = { classGroupId: event.classGroupId, eventName: event.name, courseName: event.courseName, fromDate }
}

function cancelActionTarget(): void {
  actionTarget.value = null
}

function handleMoveWhole(toDate: string): void {
  const target = actionTarget.value
  actionTarget.value = null
  if (!target || target.fromDate === toDate) return
  applyReschedule(target.classGroupId, target.fromDate, toDate, false)
}

function handlePostponeFromHere(toDate: string): void {
  const target = actionTarget.value
  actionTarget.value = null
  if (!target) return

  if (target.fromDate === toDate) {
    rescheduleWarning.value = "Escolha uma data diferente da atual para reagendar a aula."
    return
  }

  const result = classGroupsStore.postpone(target.classGroupId, target.fromDate, toDate)

  if (result.ok) return

  if (result.conflict || result.capacityConflict) {
    rescheduleConflict.value = { conflict: result.conflict, capacityConflict: result.capacityConflict }
    return
  }

  rescheduleWarning.value =
    "Só é possível adiar uma aula para uma data POSTERIOR à original — para antecipar, use a opção \"Mover a turma inteira\"."
}

function applyReschedule(classGroupId: string, fromDate: string, toDate: string, confirmAdvance: boolean): void {
  const result = classGroupsStore.reschedule(classGroupId, fromDate, toDate, confirmAdvance)

  if (result.ok) {
    pendingAdvanceConfirmation.value = null
    return
  }

  if (result.requiresAdvanceConfirmation && result.proposedStartDate) {
    pendingAdvanceConfirmation.value = { classGroupId, fromDate, toDate, proposedStartDate: result.proposedStartDate }
    return
  }

  if (result.conflict || result.capacityConflict) {
    rescheduleConflict.value = { conflict: result.conflict, capacityConflict: result.capacityConflict }
  }
}

function confirmAdvanceReschedule(): void {
  const pending = pendingAdvanceConfirmation.value
  if (!pending) return
  applyReschedule(pending.classGroupId, pending.fromDate, pending.toDate, true)
}

function cancelAdvanceReschedule(): void {
  pendingAdvanceConfirmation.value = null
}

function closeRescheduleConflict(): void {
  rescheduleConflict.value = null
}

function closeRescheduleWarning(): void {
  rescheduleWarning.value = null
}

// ---------- Navegação: avança/volta um "passo" de acordo com a visão ativa ----------

function goPrevious(): void {
  switch (viewMode.value) {
    case "day": referenceDate.value = addDays(referenceDate.value, -1); break
    case "week": referenceDate.value = addDays(referenceDate.value, -7); break
    case "month": referenceDate.value = addMonths(referenceDate.value, -1); break
    case "semester": referenceDate.value = addMonths(referenceDate.value, -6); break
    case "year": referenceDate.value = addMonths(referenceDate.value, -12); break
  }
}

function goNext(): void {
  switch (viewMode.value) {
    case "day": referenceDate.value = addDays(referenceDate.value, 1); break
    case "week": referenceDate.value = addDays(referenceDate.value, 7); break
    case "month": referenceDate.value = addMonths(referenceDate.value, 1); break
    case "semester": referenceDate.value = addMonths(referenceDate.value, 6); break
    case "year": referenceDate.value = addMonths(referenceDate.value, 12); break
  }
}

function goToToday(): void {
  referenceDate.value = new Date()
}

// ---------- Visão: Dia ----------

const dayIso = computed(() => toIso(referenceDate.value))
const dayLabel = computed(() => {
  const d = referenceDate.value
  return `${WEEKDAY_HEADER[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]} de ${d.getFullYear()}`
})

// ---------- Visão: Semana ----------

interface DayCell {
  day: number
  iso: string
  inCurrentMonth: boolean
}

const weekCells = computed<DayCell[]>(() => {
  const start = addDays(referenceDate.value, -referenceDate.value.getDay())
  const currentMonth = referenceDate.value.getMonth()
  const cells: DayCell[] = []
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i)
    cells.push({ day: d.getDate(), iso: toIso(d), inCurrentMonth: d.getMonth() === currentMonth })
  }
  return cells
})

const weekLabel = computed(() => {
  const start = addDays(referenceDate.value, -referenceDate.value.getDay())
  const end = addDays(start, 6)
  return `${start.getDate()} de ${MONTH_SHORT_NAMES[start.getMonth()]} – ${end.getDate()} de ${MONTH_SHORT_NAMES[end.getMonth()]} de ${end.getFullYear()}`
})

// ---------- Visão: Mês ----------

const monthCells = computed<DayCell[]>(() => {
  const year = referenceDate.value.getFullYear()
  const month = referenceDate.value.getMonth() // 0-11
  const firstOfMonth = new Date(year, month, 1)
  const firstWeekday = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: DayCell[] = []

  const daysInPrevMonth = new Date(year, month, 0).getDate()
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const d = new Date(year, month - 1, day)
    cells.push({ day, iso: toIso(d), inCurrentMonth: false })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, iso: toIso(new Date(year, month, day)), inCurrentMonth: true })
  }

  const remainder = cells.length % 7
  if (remainder !== 0) {
    for (let day = 1; day <= 7 - remainder; day++) {
      const d = new Date(year, month + 1, day)
      cells.push({ day, iso: toIso(d), inCurrentMonth: false })
    }
  }

  return cells
})

const monthLabel = computed(() => `${MONTH_NAMES[referenceDate.value.getMonth()]} de ${referenceDate.value.getFullYear()}`)

// ---------- Visão: Semestre e Ano (grade de mini-meses) ----------

interface MiniMonth {
  year: number
  month: number // 0-11
  label: string
  eventCount: number
}

function buildMiniMonths(startMonth: number, count: number): MiniMonth[] {
  const year = referenceDate.value.getFullYear()
  const months: MiniMonth[] = []
  for (let i = 0; i < count; i++) {
    const monthIndex = startMonth + i
    const d = new Date(year, monthIndex, 1)
    const y = d.getFullYear()
    const m = d.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    let eventCount = 0
    for (let day = 1; day <= daysInMonth; day++) {
      eventCount += eventsFor(toIso(new Date(y, m, day))).length
    }
    months.push({ year: y, month: m, label: `${MONTH_NAMES[m]} de ${y}`, eventCount })
  }
  return months
}

const semesterMonths = computed(() => {
  const half = referenceDate.value.getMonth() < 6 ? 0 : 6
  return buildMiniMonths(half, 6)
})

const semesterLabel = computed(() => {
  const half = referenceDate.value.getMonth() < 6 ? "1º" : "2º"
  return `${half} semestre de ${referenceDate.value.getFullYear()}`
})

const yearMonths = computed(() => buildMiniMonths(0, 12))
const yearLabel = computed(() => `${referenceDate.value.getFullYear()}`)

function openMonth(year: number, month: number): void {
  referenceDate.value = new Date(year, month, 1)
  viewMode.value = "month"
}

const periodLabel = computed(() => {
  switch (viewMode.value) {
    case "day": return dayLabel.value
    case "week": return weekLabel.value
    case "month": return monthLabel.value
    case "semester": return semesterLabel.value
    case "year": return yearLabel.value
  }
  return ""
})
</script>

<template>
  <div class="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-base font-semibold capitalize text-slate-800 dark:text-slate-100">{{ periodLabel }}</h3>

      <div class="flex flex-wrap items-center gap-2">
        <div class="flex rounded-md border border-slate-300 p-0.5 text-xs dark:border-slate-600">
          <button
            v-for="mode in VIEW_MODES"
            :key="mode"
            type="button"
            class="rounded px-2.5 py-1 font-medium"
            :class="viewMode === mode ? 'bg-[#0050a0] text-white dark:bg-[#1a6fc4]' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'"
            @click="viewMode = mode"
          >
            {{ VIEW_MODE_LABELS[mode] }}
          </button>
        </div>

        <div class="flex items-center gap-1.5">
          <button type="button" class="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700" @click="goPrevious">
            &larr;
          </button>
          <button type="button" class="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700" @click="goToToday">
            Hoje
          </button>
          <button type="button" class="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700" @click="goNext">
            &rarr;
          </button>
        </div>
      </div>
    </div>

    <!-- Visão Dia -->
    <div v-if="viewMode === 'day'" class="rounded-md border border-slate-200 dark:border-slate-700">
      <div v-if="eventsFor(dayIso).length === 0" class="p-6 text-center text-sm text-slate-400 dark:text-slate-500">
        Nenhuma aula neste dia.
      </div>
      <ul v-else class="divide-y divide-slate-100 dark:divide-slate-700">
        <li v-for="event in eventsFor(dayIso)" :key="event.classGroupId" class="flex items-center gap-3 p-3">
          <span class="h-3 w-3 shrink-0 rounded-full border border-slate-300 dark:border-slate-600" :style="{ backgroundColor: event.colorHex }" />
          <div>
            <p class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ event.name }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ event.courseName }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ event.teacherName }} · {{ event.timeSlotText }}<template v-if="event.roomName"> · {{ event.roomName }}</template>
            </p>
          </div>
        </li>
      </ul>
    </div>

    <!-- Visão Semana -->
    <div v-else-if="viewMode === 'week'" class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div class="grid min-w-[560px] grid-cols-7 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 text-xs dark:border-slate-700 dark:bg-slate-700">
        <div v-for="wd in WEEKDAY_HEADER" :key="wd" class="bg-slate-50 px-2 py-1.5 text-center font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          {{ wd }}
        </div>
        <div
          v-for="cell in weekCells"
          :key="cell.iso"
          class="min-h-[110px] bg-white p-1.5 dark:bg-slate-800 sm:min-h-[140px]"
        >
          <div class="mb-1 text-right text-[11px] text-slate-500 dark:text-slate-400">{{ cell.day }}</div>
          <div class="flex flex-col gap-1">
            <button
              v-for="event in eventsFor(cell.iso)"
              :key="event.classGroupId"
              type="button"
              class="rounded px-1.5 py-1 text-left text-[11px] font-medium text-white"
              :style="{ backgroundColor: event.colorHex }"
              :title="eventTooltip(event)"
              @click="onEventTap(event, cell.iso)"
            >
              <div class="truncate">{{ event.name }}</div>
              <div class="truncate opacity-90">{{ event.timeSlotText }}</div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Visão Mês -->
    <div v-else-if="viewMode === 'month'" class="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div class="grid min-w-[560px] grid-cols-7 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 text-xs dark:border-slate-700 dark:bg-slate-700">
        <div v-for="wd in WEEKDAY_HEADER" :key="wd" class="bg-slate-50 px-2 py-1.5 text-center font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          {{ wd }}
        </div>
        <div
          v-for="cell in monthCells"
          :key="cell.iso"
          class="min-h-[68px] bg-white p-1.5 dark:bg-slate-800 sm:min-h-[92px]"
          :class="{ 'bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500': !cell.inCurrentMonth }"
        >
          <div class="mb-1 text-right text-[11px]" :class="cell.inCurrentMonth ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600'">
            {{ cell.day }}
          </div>
          <div class="flex flex-col gap-1">
            <button
              v-for="event in eventsFor(cell.iso)"
              :key="event.classGroupId"
              type="button"
              class="truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium text-white"
              :style="{ backgroundColor: event.colorHex }"
              :title="eventTooltip(event)"
              @click="onEventTap(event, cell.iso)"
            >
              {{ event.name }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Visão Semestre -->
    <div v-else-if="viewMode === 'semester'" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="m in semesterMonths"
        :key="`${m.year}-${m.month}`"
        type="button"
        class="rounded-md border border-slate-200 p-4 text-left hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"
        @click="openMonth(m.year, m.month)"
      >
        <p class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ m.label }}</p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ m.eventCount }} aula(s) no mês</p>
      </button>
    </div>

    <!-- Visão Ano -->
    <div v-else-if="viewMode === 'year'" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <button
        v-for="m in yearMonths"
        :key="`${m.year}-${m.month}`"
        type="button"
        class="rounded-md border border-slate-200 p-3 text-left hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"
        @click="openMonth(m.year, m.month)"
      >
        <p class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ MONTH_SHORT_NAMES[m.month] }}</p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ m.eventCount }} aula(s)</p>
      </button>
    </div>

    <RescheduleActionModal
      v-if="actionTarget"
      :event-name="actionTarget.eventName"
      :course-name="actionTarget.courseName"
      :current-date="actionTarget.fromDate"
      @move-whole="handleMoveWhole"
      @postpone-from-here="handlePostponeFromHere"
      @cancel="cancelActionTarget"
    />

    <RescheduleConfirmModal
      v-if="pendingAdvanceConfirmation"
      :new-start-date="pendingAdvanceConfirmation.proposedStartDate"
      @confirm="confirmAdvanceReschedule"
      @cancel="cancelAdvanceReschedule"
    />

    <RescheduleConflictModal
      v-if="rescheduleConflict"
      :conflict="rescheduleConflict.conflict"
      :capacity-conflict="rescheduleConflict.capacityConflict"
      @close="closeRescheduleConflict"
    />

    <div
      v-if="rescheduleWarning"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeRescheduleWarning"
    >
      <div class="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-5 shadow-lg dark:bg-slate-800">
        <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">Não foi possível adiar a aula</h3>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ rescheduleWarning }}</p>
        <div class="mt-4 flex justify-end">
          <button
            type="button"
            class="rounded-md bg-[#0050a0] px-4 py-2 text-sm font-medium text-white hover:bg-[#003d7a] dark:bg-[#1a6fc4] dark:hover:bg-[#0050a0]"
            @click="closeRescheduleWarning"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
