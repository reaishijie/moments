<script setup lang="ts" name="ASidebar">
import { useSidebarStore } from '@/store/admin/sidebar';
import { SunRegular, AddressCardRegular, CommentRegular, Buffer, NodeJs, GemRegular, AngleDown } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import { RouterLink } from 'vue-router';
import { ref, type Component } from 'vue';

const sidebarStore = useSidebarStore()
const iconMap: Record<string, Component> = {
  'default': NodeJs,
  'dashboard': GemRegular,
  'admin-article': Buffer,
  'admin-comment': CommentRegular,
  'admin-setting': SunRegular,
  'admin-user': AddressCardRegular
}
const openParentName = ref<string | null>(null)
function isShowChildren(name: string) {
  openParentName.value = openParentName.value === name ? null : name
}
</script>

<template>
  <div class="admin-layout-container">
    <!-- 侧边栏顶部文字 -->
    <div class="sidebar-top">
      瞬刻
    </div>
    <div class="sidebar-main">
      <ul>
        <li v-for="item in sidebarStore.arr" :key="item.path">
          <!-- 有没有子路由 -> 判断是否显示展开图标 -->
          <div v-if="item.children">
            <div class="sidebar-main-item" @click="isShowChildren(item.name as string)"
              :title="item.meta?.title as string || '其他页面'">
              <div class="item-icon">
                <Icon size="20px">
                  <component :is="iconMap[item.name as string] || NodeJs" />
                </Icon>
              </div>
              <div class="item-content" v-if="sidebarStore.isShowContent">{{ item.meta!.title }}</div>
              <Icon v-if="sidebarStore.isShowContent" style="margin-left: 30px;"
                :class="{ 'rotate-icon': openParentName === item.name }">
                <AngleDown />
              </Icon>
            </div>
          </div>
          <div v-else>
            <router-link :to="{ name: item.name }">
              <div class="sidebar-main-item" :title="item.meta?.title as string || '其他页面'">
                <div class="item-icon">
                  <Icon size="20px">
                    <component :is="iconMap[item.name as string] || NodeJs" />
                  </Icon>
                </div>
                <div class="item-content" v-if="sidebarStore.isShowContent">{{ item.meta!.title }}</div>
              </div>
            </router-link>
          </div>

          <!-- 如果还有子路由，再循环出子菜单 -->
          <Transition name="fade">
            <div v-if="item.children && openParentName === item.name">
              <ul>
                <li v-for="child in item.children" :key="child.path" class="children-list">
                  <router-link :to="{ name: child.name }">
                    <div class="sidebar-main-item" :title="child.meta?.title as string || '其他页面'">
                      <div class="item-icon">
                        <Icon size="20px">
                          <component :is="iconMap[child.name as string] || NodeJs" />
                        </Icon>
                      </div>
                      <div class="item-content" v-if="sidebarStore.isShowContent">{{ child.meta!.title }}</div>
                    </div>
                  </router-link>
                </li>
              </ul>
            </div>
          </Transition>

        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.admin-layout-container {
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  box-shadow: 0 0 8px skyblue;
}

.sidebar-top {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 0 10px 0;
  font-size: 25px;
  border-bottom: 2px solid #f0f2f5;
  background: #000;
  color: #FFFFFF;
}

.sidebar-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

ul,
li {
  list-style: none;
  padding: 0;
  margin: 0;
}

a {
  text-decoration: none;
  color: inherit;
}

.sidebar-main-item {
  display: flex;
  padding: 10px 10px;
  border-radius: 5px;
  border-bottom: 2px solid #f0f2f5;
}

.sidebar-main-item:hover {
  background-color: rgb(207, 232, 241);
  cursor: pointer;
}

.item-icon {
  margin: 0 15px 0 10px;
  /* color: rgb(110, 188, 234); */
  color: #000000c0;

}

.item-content {
  margin-right: 15px;
  color: #000000b9;
}

.children-list {
  padding-left: 20px;
}

.rotate-icon {
  transition: transform 0.3s ease;
  transform: rotate(180deg);
}

/* 子路由菜单的显示与隐藏过渡动画 */
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