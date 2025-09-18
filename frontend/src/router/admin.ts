import AdminLayout from '@/layouts/AdminLayout.vue';
import type { RouteRecordRaw } from 'vue-router'

const adminRoutes: RouteRecordRaw[] = [
    {
        path: '/admin',
        name: 'admin',
        component: AdminLayout, // 前台布局组件
        children: [
            {
                path: '',
                name: 'dashboard',
                component: () => import('@/views/admin/Dashboard.vue'),
                meta: { title: '控制台' }
            },
            {
                path: 'setting',
                name: 'admin-setting',
                component: () => import('@/components/admin/Setting.vue'),
                meta: { title: '系统设置' },
                children: [
                    {
                        path:'user',
                        name: 'admin-seeting-site',
                        component: () => import('@/views/Post.vue'),
                        meta: {title: '系统设置'}
                    },
                    {
                        path:'user',
                        name: 'admin-seeting-user',
                        component: () => import('@/views/Demo.vue'),
                        meta: {title: '用户设置'}
                    },
                ]
            },
            {
                path: 'user',
                name: 'admin-user',
                component: () => import('@/components/admin/User.vue'),
                meta: { title: '用户管理' }
            },
            {
                path: 'article',
                name: 'admin-article',
                component: () => import('@/components/admin/Article.vue'),
                meta: { title: '文章管理', icon: 'Adjust' }
            },
            {
                path: 'comment',
                name: 'admin-comment',
                component: () => import('@/components/admin/Comment.vue'),
                meta: { title: '评论管理' }
            },
        ]
    }
];

export default adminRoutes;