<script setup lang="ts" name="HeaderBar">
import { ref } from 'vue';
import { Icon } from '@vicons/utils';
import { AngleDoubleRight, AngleDown} from '@vicons/fa';
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
        <!-- 侧边栏折叠、展开 -->
        <Icon @click="sidebarStore.isShowContent = !sidebarStore.isShowContent"
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
    margin-top: 10px;
    border-radius: 5px;
    box-shadow: 0 0 8px skyblue;
    left: 20%
}

.userSetting-item {
    padding: 2px 5px;
    margin: 5px;
    font-size: small;
    /* margin-top: 5px; */
}

a {
    text-decoration: none;
    color: inherit;
}

.userSetting-item:nth-child(3) {
    border-top: 5px solid #f2f2f2;
}

.userSetting-item:hover {
    background: #f5f5f5;
    cursor: pointer;
    border-radius: 5px;
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
</style>