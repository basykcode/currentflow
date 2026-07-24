import type { RouteRecordRaw } from 'vue-router'

export const alchemyChildRoutes: readonly RouteRecordRaw[] = [
  {
    path: '',
    redirect: { name: 'alchemy-materia-medica' },
  },
  {
    path: 'materia-medica',
    name: 'alchemy-materia-medica',
    component: () => import('./views/MateriaMedicaView.vue'),
  },
  {
    path: 'materia-medica/:herbId',
    name: 'alchemy-herb-detail',
    component: () => import('./views/MateriaMedicaView.vue'),
  },
  {
    path: 'formulas',
    name: 'alchemy-formulas',
    component: () => import('./views/FormulaLibraryView.vue'),
  },
  {
    path: 'formulas/:formulaId',
    name: 'alchemy-formula-detail',
    component: () => import('./views/FormulaLibraryView.vue'),
  },
  {
    path: 'workbench',
    name: 'alchemy-workbench',
    component: () => import('./views/FormulaWorkbenchView.vue'),
  },
  {
    path: 'texts',
    name: 'alchemy-texts',
    component: () => import('./views/TextLibraryView.vue'),
  },
  {
    path: 'inquiry',
    name: 'alchemy-inquiry',
    component: () => import('./views/GuidedInquiryView.vue'),
  },
]
