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
        // 查询单个用户的文章页面
        path: '/home/:username',
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