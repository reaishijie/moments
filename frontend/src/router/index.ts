import { createRouter, createWebHistory } from "vue-router";
import { getUserIdByUsername } from "@/api/users";
import { getArticleDetails } from "@/api/articles";
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'


const routes = [
    {
        path: '/',
        name: 'index',
        alias: '/index',
        component: () => import('@/views/Index.vue')
    },
    {
        path: '/demo',
        name: 'demo',
        component: () => import('@/views/Demo.vue')
    },
    {
        // 查询单个用户的文章页面
        path: '/home/:username',
        name: 'home',
        component: () => import('@/views/Home.vue'),
        // 动态路由
        beforeEnter: async (
            to: RouteLocationNormalized,
            _from: RouteLocationNormalized,
            next: NavigationGuardNext
        ) => {
            try {
                const exists = await getUserIdByUsername(to.params.username as string)
                if (exists) {
                    next()
                } else {
                    next({ name: 'NotFound' })
                }
            } catch (error) {
                next({ name: 'NotFound' })
            }
        }
    },
    {
        // 查询单个文章详情的页面
        path: '/article/:articleId',
        name: 'articleDetail',
        component: () => import('@/views/Detail.vue'),
        // 动态路由
        beforeEnter: async (
            to: RouteLocationNormalized,
            _from: RouteLocationNormalized,
            next: NavigationGuardNext
        ) => {
            try {
                const res = await getArticleDetails( Number(to.params.articleId))
                if (res.data.status === 1) {
                    next()
                } else {
                    next({ name: 'NotFound' })
                }
            } catch (error) {
                next({ name: 'NotFound' })
            }
        }
    },
    {
        path: '/profile',
        name: 'profile',
        component: () => import('@/views/Profile.vue')
    },
    {
        path: '/post',
        name: 'post',
        component: () => import('@/views/Post.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router