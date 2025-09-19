<script setup lang="ts" name="AdminLayout">
import { RouterView } from 'vue-router';
import sidebar from '@/components/admin/Sidebar.vue';
import HeaderBar from '@/components/admin/HeaderBar.vue';
</script>

<template>
    <div class="container">
        <sidebar />
        <div class="container-right">
            <div class="container-right-top">
                <HeaderBar />
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
    min-width: 300px;
    height: 100vh;
    background: #FFFFFF;
}

.container-right {
    display: flex;
    flex: 1;
    flex-direction: column;
}

.container-right-top {
    display: flex;
    justify-content: space-between;
    background: #FFFFFF;
    padding: 10px 0;
}

.container-right-bottom {
    display: flex;
    flex: 1;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 20px;
    padding: 15px 20px 20px 20px;
    background: #f2f2f2;
}
</style>