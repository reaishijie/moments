import FrontLayout from '@/layouts/FrontLayout.vue';
import type { RouteRecordRaw } from 'vue-router'

const frontRoutes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'frontend',
        component: FrontLayout, // 前台布局组件
        children: [
            {
                path: '',
                name: 'index',
                component: () => import('@/views/Index.vue'),
                meta: { title: '瞬刻' }
            },
            {
                path: '/demo',
                name: 'demo',
                component: () => import('@/views/Demo.vue'),
                meta: { title: '测试页面' }
            },
            {
                path: '/home/:username',
                name: 'home',
                component: () => import('@/views/Home.vue'),
                meta: { title: '用户主页' }
            },
            {
                path: '/article/:articleId',
                name: 'articleDetail',
                component: () => import('@/views/Detail.vue'),
                meta: { title: '文章详情' }
            },
            {
                path: '/profile',
                name: 'profile',
                component: () => import('@/views/Profile.vue'),
                meta: { title: '个人资料' }
            },
            {
                path: '/post',
                name: 'post',
                component: () => import('@/views/Post.vue'),
                meta: { title: '发表文章' }
            },
        ]
    }
];

export default frontRoutes;