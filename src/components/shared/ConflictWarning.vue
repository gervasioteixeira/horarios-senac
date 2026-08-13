<script setup lang="ts">
import { computed } from "vue"
import type { ScheduleConflict } from "../../services/conflictChecker"
import { useTeachersStore } from "../../stores/teachers"
import { WEEKDAY_LABELS } from "../../constants/schedule"

const props = defineProps<{
  conflict: ScheduleConflict
}>()

const teachersStore = useTeachersStore()

const teacherName = computed(() => {
  return teachersStore.getById(props.conflict.conflictingClassGroup.teacherId)?.name ?? "Professor desconhecido"
})

const sharedWeekdaysLabel = computed(() => {
  return props.conflict.sharedWeekdays.map((d) => WEEKDAY_LABELS[d]).join(", ")
})
</script>

<template>
  <div class="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800">
    <p class="font-semibold">Conflito de horário detectado</p>
    <p class="mt-1">
      Esta turma colide com a turma
      <strong>"{{ conflict.conflictingClassGroup.name }}"</strong>
      do professor <strong>{{ teacherName }}</strong>,
      nos dias <strong>{{ sharedWeekdaysLabel }}</strong>,
      no período de <strong>{{ conflict.conflictingClassGroup.startDate }}</strong>
      a <strong>{{ conflict.conflictingClassGroup.computedEndDate ?? "indefinido" }}</strong>.
    </p>
    <p class="mt-1 text-red-700">Ajuste o dia, horário ou professor para salvar esta turma.</p>
  </div>
</template>
