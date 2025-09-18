import { createRouter, createWebHistory } from "vue-router";
import frontRoutes from "./frontend";
import adminRoutes from "./admin";
const title = import.meta.env.VITE_APP_TITLE

const routes = [
    ...frontRoutes,
    ...adminRoutes,
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: { title: `内容不存在 - ${title}` }
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