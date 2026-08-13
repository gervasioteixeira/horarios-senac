<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import type { ClassGroup, TimeSlot, Weekday } from "../../types"
import { useCoursesStore } from "../../stores/courses"
import { useTeachersStore } from "../../stores/teachers"
import { useClassGroupsStore, type ClassGroupDraft } from "../../stores/classGroups"
import type { ScheduleConflict } from "../../services/conflictChecker"
import { ALLOWED_TIME_SLOTS, ALL_WEEKDAYS, WEEKDAY_LABELS, timeSlotLabel } from "../../constants/schedule"
import MonthlyBreakdown from "../calendar/MonthlyBreakdown.vue"
import ConflictWarning from "../shared/ConflictWarning.vue"

const props = defineProps<{
  classGroup?: ClassGroup | null
}>()

const emit = defineEmits<{
  saved: [classGroup: ClassGroup]
  cancel: []
}>()

const coursesStore = useCoursesStore()
const teachersStore = useTeachersStore()
const classGroupsStore = useClassGroupsStore()

function defaultState(): ClassGroupDraft {
  return {
    courseId: "",
    teacherId: "",
    name: "",
    startDate: "",
    dailyWorkloadHours: 4,
    weekdays: [],
    timeSlot: { ...ALLOWED_TIME_SLOTS[0] },
    status: "planned",
  }
}

const form = reactive<ClassGroupDraft>(defaultState())
const conflict = ref<ScheduleConflict | null>(null)
const saveError = ref("")

function resetFromProp(): void {
  const cg = props.classGroup
  if (cg) {
    form.courseId = cg.courseId
    form.teacherId = cg.teacherId
    form.name = cg.name
    form.startDate = cg.startDate
    form.dailyWorkloadHours = cg.dailyWorkloadHours
    form.weekdays = [...cg.weekdays]
    form.timeSlot = { ...cg.timeSlot }
    form.status = cg.status
  } else {
    Object.assign(form, defaultState())
  }
  conflict.value = null
  saveError.value = ""
}

watch(() => props.classGroup, resetFromProp, { immediate: true })

const selectedTimeSlotKey = computed({
  get: () => `${form.timeSlot.start}-${form.timeSlot.end}`,
  set: (key: string) => {
    const found = ALLOWED_TIME_SLOTS.find((s) => `${s.start}-${s.end}` === key)
    if (found) form.timeSlot = { ...found } as TimeSlot
  },
})

function toggleWeekday(day: Weekday): void {
  const idx = form.weekdays.indexOf(day)
  if (idx >= 0) {
    form.weekdays.splice(idx, 1)
  } else {
    form.weekdays.push(day)
  }
}

const selectedCourse = computed(() => coursesStore.getById(form.courseId))

/** Formulário preenchido o suficiente para calcular um preview de calendário. */
const canPreview = computed(() => {
  return Boolean(
    form.startDate &&
      form.dailyWorkloadHours > 0 &&
      form.weekdays.length > 0 &&
      selectedCourse.value &&
      selectedCourse.value.totalWorkloadHours > 0,
  )
})

const preview = computed(() => {
  if (!canPreview.value || !selectedCourse.value) return null
  return classGroupsStore.computeSchedule(
    { startDate: form.startDate, dailyWorkloadHours: form.dailyWorkloadHours, weekdays: form.weekdays },
    { totalWorkloadHours: selectedCourse.value.totalWorkloadHours },
  )
})

// Recalcula o preview automaticamente sempre que os campos relevantes mudam
// (o computed acima já é reativo, mas o watch garante que erros de conflito
// anteriores sejam limpos assim que o usuário altera o formulário).
watch(
  () => [form.courseId, form.teacherId, form.startDate, form.dailyWorkloadHours, form.weekdays.join(","), form.timeSlot.start, form.timeSlot.end],
  () => {
    conflict.value = null
    saveError.value = ""
  },
)

const canSubmit = computed(() => {
  return Boolean(
    form.courseId &&
      form.teacherId &&
      form.name.trim() &&
      form.startDate &&
      form.dailyWorkloadHours > 0 &&
      form.weekdays.length > 0,
  )
})

function handleSubmit(): void {
  if (!canSubmit.value) return
  const course = selectedCourse.value
  if (!course) {
    saveError.value = "Selecione um curso válido."
    return
  }

  const draft: ClassGroupDraft = {
    courseId: form.courseId,
    teacherId: form.teacherId,
    name: form.name.trim(),
    startDate: form.startDate,
    dailyWorkloadHours: Number(form.dailyWorkloadHours),
    weekdays: [...form.weekdays],
    timeSlot: { ...form.timeSlot },
    status: form.status,
  }

  const result = classGroupsStore.save(draft, { totalWorkloadHours: course.totalWorkloadHours }, props.classGroup?.id)

  if (!result.ok) {
    if (result.conflict) {
      conflict.value = result.conflict
    } else {
      saveError.value = "Não foi possível salvar a turma."
    }
    return
  }

  conflict.value = null
  saveError.value = ""
  if (result.classGroup) emit("saved", result.classGroup)
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700" for="cg-course">Curso *</label>
        <select
          id="cg-course"
          v-model="form.courseId"
          required
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          <option value="" disabled>Selecione um curso</option>
          <option v-for="c in coursesStore.courses" :key="c.id" :value="c.id">
            {{ c.name }} ({{ c.totalWorkloadHours }}h)
          </option>
        </select>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700" for="cg-teacher">Professor *</label>
        <select
          id="cg-teacher"
          v-model="form.teacherId"
          required
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          <option value="" disabled>Selecione um professor</option>
          <option v-for="t in teachersStore.teachers" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
        <div v-if="form.teacherId" class="mt-1 flex items-center gap-2 text-xs text-slate-500">
          <span
            class="inline-block h-3 w-3 rounded-full border border-slate-300"
            :style="{ backgroundColor: teachersStore.getById(form.teacherId)?.colorHex }"
          />
          <span>Cor do professor no calendário</span>
        </div>
      </div>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700" for="cg-name">Nome da turma *</label>
      <input
        id="cg-name"
        v-model="form.name"
        type="text"
        required
        placeholder='Ex: "Excel Básico - Turma Manhã Jan/2026"'
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700" for="cg-start-date">Data de início *</label>
        <input
          id="cg-start-date"
          v-model="form.startDate"
          type="date"
          required
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700" for="cg-daily-hours">Carga horária diária (horas) *</label>
        <input
          id="cg-daily-hours"
          v-model.number="form.dailyWorkloadHours"
          type="number"
          min="1"
          step="0.5"
          required
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
    </div>

    <div>
      <span class="mb-1 block text-sm font-medium text-slate-700">Dias da semana *</span>
      <div class="flex flex-wrap gap-3">
        <label
          v-for="day in ALL_WEEKDAYS"
          :key="day"
          class="flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm has-[:checked]:border-slate-900 has-[:checked]:bg-slate-900 has-[:checked]:text-white"
        >
          <input
            type="checkbox"
            class="sr-only"
            :checked="form.weekdays.includes(day)"
            @change="toggleWeekday(day)"
          />
          {{ WEEKDAY_LABELS[day] }}
        </label>
      </div>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700" for="cg-time-slot">Faixa de horário *</label>
      <select
        id="cg-time-slot"
        v-model="selectedTimeSlotKey"
        required
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none sm:w-96"
      >
        <option v-for="slot in ALLOWED_TIME_SLOTS" :key="`${slot.start}-${slot.end}`" :value="`${slot.start}-${slot.end}`">
          {{ timeSlotLabel(slot) }}
        </option>
      </select>
    </div>

    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700" for="cg-status">Status</label>
      <select
        id="cg-status"
        v-model="form.status"
        class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none sm:w-56"
      >
        <option value="planned">Planejada</option>
        <option value="ongoing">Em andamento</option>
        <option value="finished">Concluída</option>
        <option value="cancelled">Cancelada</option>
      </select>
    </div>

    <div v-if="preview" class="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p class="mb-2 text-sm font-medium text-slate-700">
        Previsão de término:
        <span class="font-semibold text-slate-900">{{ preview.endDate ?? "não foi possível calcular" }}</span>
      </p>
      <MonthlyBreakdown :breakdown="preview.monthlyBreakdown" />
    </div>

    <ConflictWarning v-if="conflict" :conflict="conflict" />
    <p v-if="saveError" class="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">{{ saveError }}</p>

    <div class="flex justify-end gap-2 pt-2">
      <button
        type="button"
        class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        :disabled="!canSubmit"
        class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Salvar turma
      </button>
    </div>
  </form>
</template>
