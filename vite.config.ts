/// <reference types="vitest/config" />
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

/** Versão do package.json + commit e horário do build, exibidos no rodapé (ver src/constants/version.ts). */
function buildInfo() {
  const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8")) as { version: string }
  let commit = ""
  try {
    commit = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim()
  } catch {
    // Sem git disponível (ex: código baixado como zip): o rodapé mostra só a versão e a data.
  }
  return { version, commit, builtAt: new Date().toISOString() }
}

// https://vite.dev/config/
const info = buildInfo()

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(info.version),
    __APP_COMMIT__: JSON.stringify(info.commit),
    __APP_BUILT_AT__: JSON.stringify(info.builtAt),
  },
  // Necessário para publicação em GitHub Pages em https://<usuario>.github.io/horarios-senac/
  base: "/horarios-senac/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.spec.ts"],
    pool: "threads",
  },
})
