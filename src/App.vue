<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router"
import BackupControls from "./components/shared/BackupControls.vue"
import AppMaintenanceControls from "./components/shared/AppMaintenanceControls.vue"

const navItems = [
  { to: "/", label: "Painel" },
  { to: "/turmas", label: "Turmas" },
  { to: "/cursos", label: "Cursos" },
  { to: "/professores", label: "Professores" },
  { to: "/feriados", label: "Feriados" },
]
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
      </aside>

      <div class="flex flex-1 flex-col">
        <main class="flex-1 overflow-x-auto p-6">
          <RouterView />
        </main>

        <footer class="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-400">
          Todos os direitos reservados<br />
          Desenvolvido por: Gervásio Teixeira —
          <a href="mailto:gervasio.eufrazino@pb.senac.br" class="text-slate-500 hover:text-slate-700 hover:underline">
            gervasio.eufrazino@pb.senac.br
          </a>
        </footer>
      </div>
    </div>
  </div>
</template>
