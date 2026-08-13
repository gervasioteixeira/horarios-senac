<script setup lang="ts">
import { ref } from "vue"
import { useTeachersStore } from "../../stores/teachers"
import { useCoursesStore } from "../../stores/courses"
import { useHolidaysStore } from "../../stores/holidays"
import { useClassGroupsStore } from "../../stores/classGroups"
import { buildBackupPayload, downloadBackupFile, InvalidBackupFileError, parseBackupFile, readFileAsText } from "../../services/backup"

const teachersStore = useTeachersStore()
const coursesStore = useCoursesStore()
const holidaysStore = useHolidaysStore()
const classGroupsStore = useClassGroupsStore()

const fileInput = ref<HTMLInputElement | null>(null)
const importError = ref<string | null>(null)
const importSuccess = ref(false)

function handleDownload(): void {
  const payload = buildBackupPayload({
    teachers: teachersStore.teachers,
    courses: coursesStore.courses,
    holidays: holidaysStore.holidays,
    classGroups: classGroupsStore.classGroups,
  })
  downloadBackupFile(payload)
}

function triggerImport(): void {
  importError.value = null
  importSuccess.value = false
  fileInput.value?.click()
}

async function handleFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const raw = await readFileAsText(file)
    const payload = parseBackupFile(raw)

    const confirmMessage =
      "Importar este backup vai SUBSTITUIR todos os dados atuais " +
      "(professores, cursos, turmas e feriados) neste navegador. Deseja continuar?"
    if (!window.confirm(confirmMessage)) {
      input.value = ""
      return
    }

    teachersStore.replaceAll(payload.data.teachers)
    coursesStore.replaceAll(payload.data.courses)
    holidaysStore.replaceAll(payload.data.holidays)
    classGroupsStore.replaceAll(payload.data.classGroups)

    importSuccess.value = true
    importError.value = null
  } catch (err) {
    importSuccess.value = false
    importError.value = err instanceof InvalidBackupFileError ? err.message : "Não foi possível importar o backup selecionado."
  } finally {
    input.value = ""
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        @click="handleDownload"
      >
        ⬇ Baixar backup
      </button>
      <button
        type="button"
        class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        @click="triggerImport"
      >
        ⬆ Importar backup
      </button>
      <input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="handleFileSelected" />
    </div>
    <p v-if="importError" class="text-xs text-red-600">{{ importError }}</p>
    <p v-if="importSuccess" class="text-xs text-emerald-600">Backup importado com sucesso.</p>
  </div>
</template>
