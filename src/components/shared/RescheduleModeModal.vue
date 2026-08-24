<script setup lang="ts">
const emit = defineEmits<{
  "move-whole": []
  "postpone-from-here": []
  cancel: []
}>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="emit('cancel')">
    <div class="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg dark:bg-slate-800">
      <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">Como deseja reagendar?</h3>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">Escolha o que fazer com esta aula e a turma.</p>

      <div class="mt-4 space-y-2">
        <button
          type="button"
          class="w-full rounded-md border border-slate-300 p-3 text-left text-sm hover:border-[#0050a0] hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#1a6fc4] dark:hover:bg-slate-700"
          @click="emit('postpone-from-here')"
        >
          <span class="block font-medium text-slate-800 dark:text-slate-100">Adiar só a partir desta aula</span>
          <span class="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
            Ex: o professor faltou. Aulas já dadas não mudam; esta e as seguintes deslocam para frente.
          </span>
        </button>

        <button
          type="button"
          class="w-full rounded-md border border-slate-300 p-3 text-left text-sm hover:border-[#0050a0] hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-[#1a6fc4] dark:hover:bg-slate-700"
          @click="emit('move-whole')"
        >
          <span class="block font-medium text-slate-800 dark:text-slate-100">Mover a turma inteira</span>
          <span class="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
            Muda a data de início oficial da turma; todas as aulas (passadas e futuras) deslocam junto.
          </span>
        </button>
      </div>

      <div class="mt-4 flex justify-end">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>
