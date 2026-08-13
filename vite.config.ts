/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

// https://vite.dev/config/
export default defineConfig({
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
