import { createRouter, createWebHistory } from 'vue-router'

import { alchemyChildRoutes } from '@/features/alchemy'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'astrology',
      component: () => import('@/views/AstrologyView.vue'),
    },
    {
      path: '/alchemy',
      component: () => import('@/views/AlchemyView.vue'),
      children: [...alchemyChildRoutes],
    },
    {
      path: '/intelligence',
      name: 'intelligence',
      component: () => import('@/views/IntelligenceView.vue'),
    },
    {
      path: '/tools',
      name: 'tools',
      component: () => import('@/views/ToolsView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})
