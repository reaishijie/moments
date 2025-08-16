import { createRouter, createWebHistory } from "vue-router";

const routes = [
    {
        path: '/',
        name: 'index',
        alias: '/index',
        component: () => import ('@/views/Index.vue')
    },
    {
        path: '/login',
        name: 'auth',
        alias: '/auth',
        component: () => import ('@/components/user/Auth.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router