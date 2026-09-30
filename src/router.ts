import { createRouter, createWebHistory } from 'vue-router'
import type { MessageKey } from '@/i18n'

declare module 'vue-router' {
  interface RouteMeta {
    titleKey?: MessageKey
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/types', name: 'chart', component: () => import('@/views/TypeChartView.vue'), meta: { titleKey: 'title.chart' } },
    { path: '/types/calc', name: 'calc', component: () => import('@/views/TypeCalcView.vue'), meta: { titleKey: 'title.calc' } },
    { path: '/types/quiz', name: 'quiz', component: () => import('@/views/TypeQuizView.vue'), meta: { titleKey: 'title.quiz' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
