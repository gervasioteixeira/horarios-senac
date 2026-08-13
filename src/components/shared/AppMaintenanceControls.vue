<script setup lang="ts">
import { ref } from "vue"
import { clearAllLocalStorage, LOCAL_STORAGE_KEYS } from "../../composables/useLocalStorage"

const clearing = ref(false)
const updating = ref(false)

/**
 * Apaga todos os dados salvos neste navegador (professores, cursos,
 * turmas, feriados) e recarrega a página. Pede confirmação dupla por
 * ser uma ação destrutiva e irreversível sem backup prévio.
 */
async function handleClearData(): Promise<void> {
  const firstConfirm = window.confirm(
    "Isso vai APAGAR PERMANENTEMENTE todos os professores, cursos, turmas e feriados " +
      "cadastrados neste navegador. Esta ação não pode ser desfeita.\n\n" +
      "Se ainda não fez backup, cancele agora e use \"Baixar backup\" antes de continuar.\n\n" +
      "Deseja continuar?",
  )
  if (!firstConfirm) return

  const secondConfirm = window.confirm("Tem certeza mesmo? Todos os dados serão perdidos definitivamente.")
  if (!secondConfirm) return

  clearing.value = true
  clearAllLocalStorage(Object.values(LOCAL_STORAGE_KEYS))
  window.location.reload()
}

/**
 * Força a atualização do aplicativo para a versão mais recente
 * publicada no GitHub Pages, contornando caches do navegador/CDN que
 * às vezes fazem uma nova funcionalidade não aparecer mesmo após o
 * deploy. Limpa caches do Cache API (se existirem) e recarrega
 * ignorando o cache local. Não afeta os dados salvos (localStorage).
 */
async function handleForceUpdate(): Promise<void> {
  updating.value = true
  try {
    if ("caches" in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((reg) => reg.unregister()))
    }
  } catch (err) {
    console.warn("[horarios-senac] Falha ao limpar caches antes de atualizar.", err)
  } finally {
    // Recarrega a partir do servidor, ignorando o cache do navegador para este documento.
    window.location.href = window.location.href.split("#")[0] + "?refresh=" + Date.now() + window.location.hash
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <button
      type="button"
      class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      :disabled="updating"
      @click="handleForceUpdate"
    >
      ⟳ {{ updating ? "Atualizando..." : "Buscar atualizações" }}
    </button>
    <button
      type="button"
      class="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      :disabled="clearing"
      @click="handleClearData"
    >
      🗑 Limpar todos os dados
    </button>
  </div>
</template>
