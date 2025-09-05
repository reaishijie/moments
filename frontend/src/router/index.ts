import { createRouter, createWebHistory } from "vue-router";
import { getUserIdByUsername } from "@/api/users";
import { getArticleDetails } from "@/api/articles";
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
const title = import.meta.env.VITE_APP_TITLE

const routes = [
    {
        path: '/',
        name: 'index',
        alias: '/index',
        component: () => import('@/views/Index.vue'),
        meta: {
            title: '瞬刻'
        }
    },
    {
        path: '/demo',
        name: 'demo',
        component: () => import('@/views/Demo.vue'),
        meta: {
            title: '测试页面'
        }
    },
    {
        // 查询单个用户的文章页面
        path: '/home/:username',
        name: 'home',
        component: () => import('@/views/Home.vue'),
        meta: {
            title: `用户主页 - ${title}`
        },
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
        meta: {
            title: `文章详情 - ${title}`
        },
        // 动态路由
        beforeEnter: async (
            to: RouteLocationNormalized,
            _from: RouteLocationNormalized,
            next: NavigationGuardNext
        ) => {
            try {
                const res = await getArticleDetails(Number(to.params.articleId))
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
        component: () => import('@/views/Profile.vue'),
        meta: {
            title: `个人资料 - ${title}`
        }
    },
    {
        path: '/post',
        name: 'post',
        component: () => import('@/views/Post.vue'),
        meta: {
            title: `发表文章 - ${title}`
        }
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: {
            title: `内容不存在 - ${title}`
        }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, _from, next) => {
    document.title = to.meta.title || title
    next()
})
export default router