<script setup lang="ts" name="HeaderBar">
import { ref, onMounted, onUnmounted } from 'vue';
import { Icon } from '@vicons/utils';
import { AngleDoubleRight, AngleDown, Bars} from '@vicons/fa';
import { useSidebarStore } from '@/store/admin/sidebar';
import router from '@/router';
import { useUserStore } from '@/store/user';
import { useMessageStore } from '@/store/message';
import { useRoute } from 'vue-router';

const route = useRoute()
const messageStore = useMessageStore()
const userStore = useUserStore()
const sidebarStore = useSidebarStore()
const isShowSetting = ref(false)
const isMobile = ref(false)

// 接收父组件传递的 sidebar ref
const props = defineProps<{
  sidebarRef?: any
}>()

// 移动端检测
function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

// 切换移动端侧边栏
function toggleMobileSidebar() {
  if (props.sidebarRef) {
    props.sidebarRef.toggleDrawer()
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 退出登录函数
function handleLogout() {
    const id = messageStore.show('正在退出登录', 'loading')
    try {
        userStore.handleLogout()
        messageStore.update(id, { text: '退出登陆成功', type: 'success', duration: 2000 })
        router.replace({ name: 'index' })
    } catch (error) {
        console.log('退出登陆失败：', error);
        messageStore.update(id, { text: '退出登陆失败', type: 'error', duration: 2000 })
    }
}
</script>

<template>
    <div class="bar-left">
        <!-- 移动端菜单按钮 -->
        <Icon v-if="isMobile" @click="toggleMobileSidebar"
            title="菜单"
            class="icon mobile-menu-btn">
            <Bars />
        </Icon>
        <!-- 桌面端侧边栏折叠、展开 -->
        <Icon v-else @click="sidebarStore.isShowContent = !sidebarStore.isShowContent"
            :title="sidebarStore.isShowContent ? '折叠' : '展开'"
            :class="['icon', { 'rotate-icon': sidebarStore.isShowContent }]">
            <AngleDoubleRight />
        </Icon>
        <!-- 面包屑导航 -->
        <div class="breadcrumb">
            <span v-for="(item, index) in route.matched" :key="index">
                <span @click="router.push(item.path)" class="breadcrumb-item">
                    {{ item.meta.title }}
                </span>
                <span v-if="index < route.matched.length - 1">/</span>
            </span>
        </div>
    </div>
    <div class="bar-right" @click="isShowSetting = !isShowSetting">
        <div class="icon">
            <span style="font-size: medium; padding-right: 5px;">{{ userStore.profile?.username }}</span>
            <Icon>
                <AngleDown />
            </Icon>
        </div>
        <Transition name="fade">
            <div class="userSetting" v-if="isShowSetting">
                <div class="userSetting-item" @click="router.push({ name: 'admin' })">主页</div>
                <div class="userSetting-item" @click="router.push({ name: 'admin-seeting-user' })">个人设置</div>
                <div class="userSetting-item" @click="handleLogout">退出登录</div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.icon {
    margin: 0px 20px;
    font-size: 20px;
    transition: transform 0.3s ease;
    cursor: pointer;
    /* color: #6ebdeaa9; */
    color: #000000c0;
}

.icon:hover {
    color: #00000079;
}

.rotate-icon {
    transition: transform 0.3s ease;
    transform: rotate(180deg);
}

.bar-left {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
}

.breadcrumb-item {
    padding: 0 5px;
    font-weight: 400;
    color: #000000ab;
}

.breadcrumb-item:hover {
    cursor: pointer;
    color: #00000043;

}

.bar-right {
    position: relative;
    display: inline-block;
}

/* 点击图标弹出内容 */
.userSetting {
    display: flex;
    flex-direction: column;
    position: absolute;
    background: #ffffff;
    top: 100%;
    right: 0;
    margin-top: 8px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border: 1px solid #e1e1e1;
    min-width: 120px;
    z-index: 1000;
}

.userSetting::before {
    content: '';
    position: absolute;
    top: -8px;
    right: 20px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-bottom: 8px solid #ffffff;
    filter: drop-shadow(0 -2px 2px rgba(0, 0, 0, 0.1));
}

.userSetting-item {
    padding: 12px 16px;
    font-size: 14px;
    color: #333;
    transition: background-color 0.2s;
    white-space: nowrap;
}

.userSetting-item:first-child {
    border-radius: 8px 8px 0 0;
}

.userSetting-item:last-child {
    border-radius: 0 0 8px 8px;
}

a {
    text-decoration: none;
    color: inherit;
}

.userSetting-item:nth-child(3) {
    border-top: 1px solid #f0f0f0;
    margin-top: 4px;
    padding-top: 8px;
}

.userSetting-item:hover {
    background: #f8f9fa;
    cursor: pointer;
}

/* 菜单弹出动画 */
.fade-enter-active,
.fade-leave-active {
    transition: all 0.35s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    /* transition: all 0.35s ease-in-out; */
}

.fade-enter-from {
    opacity: 0;
    transform: translateY(-20px);
}

.fade-leave-to {
    transform: translateY(-10px);
    opacity: 0;
}

/* 移动端样式 */
.mobile-menu-btn {
    color: #000000c0 !important;
}

.mobile-menu-btn:hover {
    color: #00000079 !important;
}

@media (max-width: 768px) {
    .breadcrumb {
        display: none;
    }
    
    .bar-left {
        justify-content: flex-start;
    }
    
    .userSetting {
        right: -10px;
        min-width: 140px;
    }
    
    .userSetting::before {
        right: 25px;
    }
}

@media (max-width: 480px) {
    .userSetting {
        right: -20px;
        min-width: 130px;
    }
    
    .userSetting::before {
        right: 30px;
    }
    
    .userSetting-item {
        padding: 10px 14px;
        font-size: 13px;
    }
}
</style>