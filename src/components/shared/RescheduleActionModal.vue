<script setup lang="ts">
import { ref } from "vue"
import { formatDateBr } from "../../constants/format"

const props = defineProps<{
  eventName: string
  courseName: string
  /** Data atual (ISO) da aula tocada, usada como valor mínimo sensato no seletor. */
  currentDate: string
}>()

const emit = defineEmits<{
  "move-whole": [toDate: string]
  "postpone-from-here": [toDate: string]
  cancel: []
}>()

const selectedDate = ref(props.currentDate)
const mode = ref<"postpone" | "move" | null>(null)

function confirm(): void {
  if (!mode.value || !selectedDate.value) return
  if (mode.value === "postpone") {
    emit("postpone-from-here", selectedDate.value)
  } else {
    emit("move-whole", selectedDate.value)
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="emit('cancel')">
    <div class="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-5 shadow-lg dark:bg-slate-800">
      <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">Reagendar aula</h3>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {{ eventName }} — {{ courseName }}<br />
        Data atual: <strong>{{ formatDateBr(currentDate) }}</strong>
      </p>

      <div class="mt-4">
        <span class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">O que fazer?</span>
        <div class="space-y-2">
          <label
            class="block w-full cursor-pointer rounded-md border p-3 text-left text-sm has-[:checked]:border-[#0050a0] has-[:checked]:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:has-[:checked]:border-[#1a6fc4] dark:has-[:checked]:bg-slate-700"
            :class="mode === 'postpone' ? 'border-[#0050a0] bg-slate-50 dark:border-[#1a6fc4] dark:bg-slate-700' : 'border-slate-300'"
          >
            <input type="radio" name="reschedule-mode" value="postpone" v-model="mode" class="sr-only" />
            <span class="block font-medium text-slate-800 dark:text-slate-100">Adiar só a partir desta aula</span>
            <span class="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
              Ex: o professor faltou. Aulas já dadas não mudam; esta e as seguintes deslocam para frente.
            </span>
          </label>

          <label
            class="block w-full cursor-pointer rounded-md border p-3 text-left text-sm has-[:checked]:border-[#0050a0] has-[:checked]:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:has-[:checked]:border-[#1a6fc4] dark:has-[:checked]:bg-slate-700"
            :class="mode === 'move' ? 'border-[#0050a0] bg-slate-50 dark:border-[#1a6fc4] dark:bg-slate-700' : 'border-slate-300'"
          >
            <input type="radio" name="reschedule-mode" value="move" v-model="mode" class="sr-only" />
            <span class="block font-medium text-slate-800 dark:text-slate-100">Mover a turma inteira</span>
            <span class="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
              Muda a data de início oficial da turma; todas as aulas (passadas e futuras) deslocam junto.
            </span>
          </label>
        </div>
      </div>

      <div class="mt-4">
        <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300" for="reschedule-new-date">Nova data</label>
        <input
          id="reschedule-new-date"
          v-model="selectedDate"
          type="date"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="!mode || !selectedDate"
          class="rounded-md bg-[#0050a0] px-4 py-2 text-sm font-medium text-white hover:bg-[#003d7a] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#1a6fc4] dark:hover:bg-[#0050a0]"
          @click="confirm"
        >
          Continuar
        </button>
      </div>
    </div>
  </div>
</template>
