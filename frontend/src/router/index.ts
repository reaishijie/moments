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
        component: () => import ('@/views/Post.vue')
    },
    {
        path: '/home',
        name: 'home',
        component: () => import ('@/views/Home.vue')
    },{
        path: '/profile',
        name: 'profile',
        component: () => import ('@/views/Profile.vue')
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router