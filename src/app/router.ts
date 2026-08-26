import { createRouter, createWebHistory } from 'vue-router'

import { alchemyChildRoutes } from '@/features/alchemy'

const developmentRoutes = import.meta.env.DEV
  ? [
      {
        path: '/__dev/celestial-instruments',
        name: 'celestial-instrument-gallery',
        component: () => import('@/views/CelestialInstrumentGalleryView.vue'),
      },
    ]
  : []

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
      redirect: '/',
    },
    {
      path: '/tools/hexagrams',
      name: 'hexagram-library',
      component: () => import('@/views/HexagramLibraryView.vue'),
    },
    {
      path: '/tools/gene-keys-prompt-lab',
      name: 'gene-keys-prompt-lab',
      component: () => import('@/features/gene-keys-prompt-lab/views/GeneKeysPromptLabView.vue'),
      meta: {
        robots: 'noindex',
      },
    },
    {
      path: '/special-messages/vh',
      name: 'special-message-vh',
      component: () => import('@/features/special-messages/views/SpecialMessageView.vue'),
      meta: {
        immersive: true,
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    ...developmentRoutes,
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})
