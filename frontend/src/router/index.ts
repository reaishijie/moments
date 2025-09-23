import { createRouter, createWebHistory } from "vue-router";
import frontRoutes from "./frontend";
import adminRoutes from "./admin";
import { useUserStore } from "@/store/user";
import { useMessageStore } from "@/store/message";

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
// 路由守卫
router.beforeEach((to, _from, next) => {
    const userStore = useUserStore();
    const messageStore = useMessageStore()
    document.title = to.meta.title || title;
    
    // 后台判断
    if (to.path.startsWith('/admin')) {
        if (userStore.profile?.role == '1') {
            next();
        } else {
            // 验证失败，重定向到首页
            next({ name: 'index' });
        }
    } else if (to.meta.login) {
        // 前台需要登录的页面
        if (userStore.profile?.status == '1') {
            next();
        } else {
            messageStore.show('请先登录账户', 'info', 2000)
            next({ name: 'index' });
        }
    } else {
        // 其他情况，直接放行
        next();
    }
});
export default router