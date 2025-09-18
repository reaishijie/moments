<script setup lang="ts" name="HeaderBar">
import { Icon } from '@vicons/utils';
import { AngleDoubleRight, UserCircleRegular } from '@vicons/fa';
import { useSidebarStore } from '@/store/admin/sidebar';

const sidebarStore = useSidebarStore()
</script>

<template>
    <Icon @click="sidebarStore.isShowContent = !sidebarStore.isShowContent"
        :title="sidebarStore.isShowContent ? '折叠' : '展开'"
        :class="['icon', { 'rotate-icon': sidebarStore.isShowContent }]">
        <AngleDoubleRight />
    </Icon>
    <Icon class="icon">
        <UserCircleRegular />
    </Icon>
</template>

<style scoped>
.icon {
    margin: 0px 15px;
    font-size: 20px;
    transition: transform 0.3s ease;
    cursor: pointer;
    /* color: #6ebdeaa9; */
    color: #000000c0;
}

.icon:hover {
    color: #6ebdea6d;
}

.rotate-icon {
    transition: transform 0.3s ease;
    transform: rotate(180deg);
}
</style>