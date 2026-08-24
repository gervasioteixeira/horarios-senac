<script setup lang="ts">
defineProps<{
  /** Nova data de início proposta, formato "YYYY-MM-DD". */
  newStartDate: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-")
  return `${day}/${month}/${year}`
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-5 shadow-lg dark:bg-slate-800">
      <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100">Antecipar início da turma?</h3>
      <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
        A data de início atualmente definida é posterior ao dia para onde a aula foi arrastada.
        Para concluir, a data de início da turma precisa ser alterada para
        <strong>{{ formatDate(newStartDate) }}</strong>, antecipando o curso.
      </p>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">Deseja confirmar a antecipação?</p>
      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="rounded-md bg-[#0050a0] px-4 py-2 text-sm font-medium text-white hover:bg-[#003d7a] dark:bg-[#1a6fc4] dark:hover:bg-[#0050a0]"
          @click="emit('confirm')"
        >
          Confirmar antecipação
        </button>
      </div>
    </div>
  </div>
</template>
