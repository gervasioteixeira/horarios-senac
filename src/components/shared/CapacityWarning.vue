<script setup lang="ts">
import type { CapacityConflict } from "../../services/conflictChecker"

defineProps<{
  conflict: CapacityConflict
}>()
</script>

<template>
  <div class="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
    <p class="font-semibold">Capacidade do espaço excedida</p>
    <p class="mt-1">
      O espaço <strong>"{{ conflict.room.name }}"</strong> comporta até
      <strong>{{ conflict.room.capacity }}</strong> aluno(s), mas foram informados
      <strong>{{ conflict.expectedStudents }}</strong> aluno(s) previstos para esta turma.
    </p>
    <p class="mt-1 text-amber-700 dark:text-amber-400">Reduza o número de alunos previstos ou escolha um espaço com capacidade maior.</p>
  </div>
</template>
