import { createRouter, createWebHistory } from 'vue-router'
import { TYPES } from '@/data/types'
import type { MessageKey } from '@/i18n'

declare module 'vue-router' {
  interface RouteMeta {
    titleKey?: MessageKey
    /** The page's meta description, for search results and link previews. */
    descKey?: MessageKey
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { descKey: 'desc.home' } },
    {
      // `/types` lists every type; `/types/fire` also shows that type's matchups.
      path: `/types/:type(${TYPES.join('|')})?`,
      name: 'types',
      component: () => import('@/views/TypesView.vue'),
      meta: { titleKey: 'title.types', descKey: 'desc.types' },
      // The chart used to live at `/types`: keep its shared cell links (?atk=…&def=…) working.
      beforeEnter: (to) => (!to.params.type && to.query.atk ? { path: '/types/chart', query: to.query } : undefined),
    },
    {
      path: '/types/chart',
      name: 'chart',
      component: () => import('@/views/TypeChartView.vue'),
      meta: { titleKey: 'title.chart', descKey: 'desc.chart' },
    },
    {
      path: '/types/calc',
      name: 'calc',
      component: () => import('@/views/TypeCalcView.vue'),
      meta: { titleKey: 'title.calc', descKey: 'desc.calc' },
    },
    {
      // One side of the calculator on its own, linked from the side-by-side headings.
      path: '/types/calc/:side(def|atk)',
      name: 'calcSide',
      component: () => import('@/views/TypeCalcView.vue'),
      meta: { titleKey: 'title.calc', descKey: 'desc.calc' },
    },
    {
      path: '/types/quiz',
      name: 'quiz',
      component: () => import('@/views/TypeQuizView.vue'),
      meta: { titleKey: 'title.quiz', descKey: 'desc.quiz' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { titleKey: 'title.settings' },
    },
    {
      path: '/credits',
      name: 'credits',
      component: () => import('@/views/CreditsView.vue'),
      meta: { titleKey: 'title.credits', descKey: 'desc.credits' },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
