<script setup lang="ts" name="AdminLayout">
import { RouterView } from 'vue-router';
import sidebar from '@/components/admin/Sidebar.vue';
import HeaderBar from '@/components/admin/HeaderBar.vue';
import { ref } from 'vue';

const sidebarRef = ref()
</script>

<template>
    <div class="container">
        <sidebar ref="sidebarRef" />
        <div class="container-right">
            <div class="container-right-top">
                <HeaderBar :sidebar-ref="sidebarRef" />
            </div>
            <div class="container-right-bottom">
                <RouterView />
            </div>
        </div>
    </div>
</template>

<style scoped>
.container {
    display: flex;
    flex-direction: row;
    min-height: 100vh;
    height: 100vh;
    background: #FFFFFF;
    overflow-x: hidden;
    width: 100%;
    max-width: 100vw;
}

.container-right {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
}

.container-right-top {
    display: flex;
    justify-content: space-between;
    background: #FFFFFF;
    padding: 10px 20px;
}

.container-right-bottom {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 20px;
    padding: 15px 20px 20px 20px;
    background: #f2f2f2;
    overflow-y: auto;
    overflow-x: hidden;
}

/* 移动端响应式布局 */
@media (max-width: 768px) {
    .container {
        flex-direction: column;
        min-width: 100vw;
    }
    
    .container-right-top {
        padding: 10px 15px;
    }
    
    .container-right-bottom {
        padding: 15px;
        gap: 15px;
    }
}
</style>