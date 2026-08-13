<script setup lang="ts">
import { ref, watch } from "vue"
import { RouterLink, RouterView, useRoute } from "vue-router"
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
/** Controla a sidebar em telas pequenas (fica sempre visível a partir do breakpoint lg). */
const sidebarOpen = ref(false)
const route = useRoute()

// Fecha a sidebar automaticamente ao navegar para outra tela (mobile).
watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  },
)

async function handleDownloadManual(): Promise<void> {
  generatingManual.value = true
  try {
    const doc = await generateUserManualPdf()
    downloadPdf(doc, "manual-do-usuario-horarios-senac.pdf")
  } finally {
    generatingManual.value = false
  }
}

/** Respeita o `base` do Vite (ex: "/horarios-senac/") tanto em dev quanto no build de produção. */
const logoUrl = `${import.meta.env.BASE_URL}senac-logo.png`
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <!-- Barra superior: só aparece em telas pequenas (abaixo do breakpoint lg) -->
    <header class="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      <div class="flex items-center gap-2">
        <img :src="logoUrl" alt="" class="h-7 w-auto" />
        <span class="text-base font-semibold text-slate-800">Horários Senac</span>
      </div>
      <button
        type="button"
        class="rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Abrir menu"
        @click="sidebarOpen = true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </header>

    <div class="flex min-h-screen">
      <!-- Fundo escurecido atrás da sidebar aberta em mobile -->
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-30 bg-black/40 lg:hidden"
        @click="sidebarOpen = false"
      />

      <aside
        class="fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] transform flex-col overflow-y-auto border-r border-slate-200 bg-white px-4 py-6 transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:w-56 lg:max-w-none lg:translate-x-0"
        :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="mb-6 flex items-center justify-between px-2">
          <div class="flex items-center gap-2">
            <img :src="logoUrl" alt="" class="hidden h-7 w-auto lg:block" />
            <h1 class="text-lg font-semibold text-slate-800">Horários Senac</h1>
          </div>
          <button
            type="button"
            class="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Fechar menu"
            @click="sidebarOpen = false"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav class="flex flex-col gap-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 lg:py-2"
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
            class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 lg:py-1.5"
            :disabled="generatingManual"
            @click="handleDownloadManual"
          >
            📖 {{ generatingManual ? "Gerando..." : "Baixar manual (PDF)" }}
          </button>
        </div>
      </aside>

      <div class="flex flex-1 flex-col">
        <main class="flex-1 overflow-x-auto p-4 sm:p-6">
          <RouterView />
        </main>

        <footer class="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-400 sm:px-6">
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
