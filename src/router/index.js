import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import MapActivityPage from '../views/MapActivityPage.vue'

const routes = [
    { path: '/', component: LandingPage },
    { path: '/map', component: MapActivityPage },
]

const router = createRouter ({
    history: createWebHistory(),
    routes,
})

export default router