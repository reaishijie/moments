import { createRouter, createWebHistory } from "vue-router";

const routes = [
    {
        path: '/',
        name: 'index',
        alias: '/index',
        component: () => import ('@/views/Index.vue')
    },
    {
        path: '/demo',
        name: 'demo',
        component: () => import ('@/Demo.vue')
    },
]


const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router