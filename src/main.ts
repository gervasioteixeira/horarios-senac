import { createApp } from "vue"
import { createPinia } from "pinia"
import "./style.css"
import App from "./App.vue"
import router from "./router"
import { useTheme } from "./composables/useTheme"

// Aplica a classe .dark (ou remove) antes de montar a árvore de componentes,
// para evitar flash de tema errado na primeira renderização.
useTheme()

createApp(App).use(createPinia()).use(router).mount("#app")
