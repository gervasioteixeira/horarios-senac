<script setup lang="ts">
import { computed } from "vue"
import type { ScheduleConflict } from "../../services/conflictChecker"
import { useTeachersStore } from "../../stores/teachers"
import { useRoomsStore } from "../../stores/rooms"
import { WEEKDAY_LABELS } from "../../constants/schedule"

const props = defineProps<{
  conflict: ScheduleConflict
}>()

const teachersStore = useTeachersStore()
const roomsStore = useRoomsStore()

const teacherName = computed(() => {
  return teachersStore.getById(props.conflict.conflictingClassGroup.teacherId)?.name ?? "Professor desconhecido"
})

const roomName = computed(() => {
  const roomId = props.conflict.conflictingClassGroup.roomId
  return roomId ? (roomsStore.getById(roomId)?.name ?? "Espaço desconhecido") : "Espaço desconhecido"
})

const sharedWeekdaysLabel = computed(() => {
  return props.conflict.sharedWeekdays.map((d) => WEEKDAY_LABELS[d]).join(", ")
})

const title = computed(() => (props.conflict.kind === "room" ? "Conflito de espaço detectado" : "Conflito de horário detectado"))

const hint = computed(() =>
  props.conflict.kind === "room"
    ? "Ajuste o dia, horário ou espaço para salvar esta turma."
    : "Ajuste o dia, horário ou professor para salvar esta turma.",
)
</script>

<template>
  <div class="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800">
    <p class="font-semibold">{{ title }}</p>
    <p v-if="conflict.kind === 'room'" class="mt-1">
      O espaço escolhido já está ocupado pela turma
      <strong>"{{ conflict.conflictingClassGroup.name }}"</strong>
      (<strong>{{ roomName }}</strong>),
      nos dias <strong>{{ sharedWeekdaysLabel }}</strong>,
      no período de <strong>{{ conflict.conflictingClassGroup.startDate }}</strong>
      a <strong>{{ conflict.conflictingClassGroup.computedEndDate ?? "indefinido" }}</strong>.
    </p>
    <p v-else class="mt-1">
      Esta turma colide com a turma
      <strong>"{{ conflict.conflictingClassGroup.name }}"</strong>
      do professor <strong>{{ teacherName }}</strong>,
      nos dias <strong>{{ sharedWeekdaysLabel }}</strong>,
      no período de <strong>{{ conflict.conflictingClassGroup.startDate }}</strong>
      a <strong>{{ conflict.conflictingClassGroup.computedEndDate ?? "indefinido" }}</strong>.
    </p>
    <p class="mt-1 text-red-700">{{ hint }}</p>
  </div>
</template>
