import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: '' } },
    { path: '/types', name: 'chart', component: () => import('@/views/TypeChartView.vue'), meta: { title: 'Type chart' } },
    { path: '/types/calc', name: 'calc', component: () => import('@/views/TypeCalcView.vue'), meta: { title: 'Type calculator' } },
    { path: '/types/quiz', name: 'quiz', component: () => import('@/views/TypeQuizView.vue'), meta: { title: 'Type quiz' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  const t = to.meta.title as string | undefined
  document.title = t ? `${t} · mondex` : 'mondex'
})
