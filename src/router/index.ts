import { createRouter, createWebHashHistory } from "vue-router"

/**
 * Usa hash history (URLs tipo /#/turmas) propositalmente: o site é
 * publicado como SPA estática em GitHub Pages, que não tem como
 * configurar rewrites de servidor para history mode sem um 404.html
 * de fallback. Hash history evita esse problema por completo.
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "dashboard", component: () => import("../views/DashboardView.vue") },
    { path: "/cursos", name: "courses", component: () => import("../views/CoursesView.vue") },
    { path: "/turmas", name: "class-groups", component: () => import("../views/ClassGroupsView.vue") },
    { path: "/professores", name: "teachers", component: () => import("../views/TeachersView.vue") },
    { path: "/espacos", name: "rooms", component: () => import("../views/RoomsView.vue") },
    { path: "/feriados", name: "holidays", component: () => import("../views/HolidaysView.vue") },
  ],
})

export default router
