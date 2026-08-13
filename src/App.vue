<script setup lang="ts">
import { ref } from "vue"
import { RouterLink, RouterView } from "vue-router"
import BackupControls from "./components/shared/BackupControls.vue"
import AppMaintenanceControls from "./components/shared/AppMaintenanceControls.vue"
import { downloadPdf, generateUserManualPdf, INSTITUTIONAL_CREDITS } from "./services/pdfGenerator"

const navItems = [
  { to: "/", label: "Painel" },
  { to: "/turmas", label: "Turmas" },
  { to: "/cursos", label: "Cursos" },
  { to: "/professores", label: "Professores" },
  { to: "/feriados", label: "Feriados" },
]

const generatingManual = ref(false)

async function handleDownloadManual(): Promise<void> {
  generatingManual.value = true
  try {
    const doc = await generateUserManualPdf()
    downloadPdf(doc, "manual-do-usuario-horarios-senac.pdf")
  } finally {
    generatingManual.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <div class="flex min-h-screen">
      <aside class="w-56 shrink-0 border-r border-slate-200 bg-white px-4 py-6">
        <h1 class="mb-6 px-2 text-lg font-semibold text-slate-800">Horários Senac</h1>
        <nav class="flex flex-col gap-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            active-class="bg-slate-900 text-white hover:bg-slate-900"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="mt-8 border-t border-slate-200 pt-4">
          <p class="mb-2 px-2 text-xs font-semibold uppercase text-slate-400">Backup</p>
          <BackupControls />
        </div>

        <div class="mt-6 border-t border-slate-200 pt-4">
          <p class="mb-2 px-2 text-xs font-semibold uppercase text-slate-400">Manutenção</p>
          <AppMaintenanceControls />
        </div>

        <div class="mt-6 border-t border-slate-200 pt-4">
          <p class="mb-2 px-2 text-xs font-semibold uppercase text-slate-400">Ajuda</p>
          <button
            type="button"
            class="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            :disabled="generatingManual"
            @click="handleDownloadManual"
          >
            📖 {{ generatingManual ? "Gerando..." : "Baixar manual (PDF)" }}
          </button>
        </div>
      </aside>

      <div class="flex flex-1 flex-col">
        <main class="flex-1 overflow-x-auto p-6">
          <RouterView />
        </main>

        <footer class="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-400">
          Todos os direitos reservados — {{ INSTITUTIONAL_CREDITS.organization }}<br />
          Desenvolvido por: {{ INSTITUTIONAL_CREDITS.developedBy }} —
          <a :href="`mailto:${INSTITUTIONAL_CREDITS.contactEmail}`" class="text-slate-500 hover:text-slate-700 hover:underline">
            {{ INSTITUTIONAL_CREDITS.contactEmail }}
          </a>
        </footer>
      </div>
    </div>
  </div>
</template>
