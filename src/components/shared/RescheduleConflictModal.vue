<script setup lang="ts">
import type { CapacityConflict, ScheduleConflict } from "../../services/conflictChecker"
import ConflictWarning from "./ConflictWarning.vue"
import CapacityWarning from "./CapacityWarning.vue"

defineProps<{
  conflict?: ScheduleConflict
  capacityConflict?: CapacityConflict
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-5 shadow-lg dark:bg-slate-800">
      <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">Não foi possível mover a turma</h3>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">A turma voltou para a posição original no calendário.</p>
      <div class="mt-3 space-y-3">
        <ConflictWarning v-if="conflict" :conflict="conflict" />
        <CapacityWarning v-if="capacityConflict" :conflict="capacityConflict" />
      </div>
      <div class="mt-4 flex justify-end">
        <button
          type="button"
          class="rounded-md bg-[#0050a0] px-4 py-2 text-sm font-medium text-white hover:bg-[#003d7a] dark:bg-[#1a6fc4] dark:hover:bg-[#0050a0]"
          @click="emit('close')"
        >
          Entendi
        </button>
      </div>
    </div>
  </div>
</template>
