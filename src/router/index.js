import { createRouter, createWebHistory } from 'vue-router'
import FichePage from '@/views/FichePage.vue'
import ExosPage from '@/views/ExosPage.vue'
import AboutPage from '@/views/AboutPage.vue'
const routes = [
  {
    path: '/fiche-de-cours',
    name: 'FichePage',
    component: FichePage
  },
  {
    path: '/exos',
    name: 'ExosPage',
    component: ExosPage
  },
  {
    path: '/a-propos',
    name: 'AboutPage',
    component: AboutPage
  },
  {
    path: '/',
    redirect: '/fiche-de-cours'
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
