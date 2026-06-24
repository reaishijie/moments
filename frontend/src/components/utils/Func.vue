<script setup lang="ts" name="Func">
import { ref, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/store/theme';
import { Icon } from '@vicons/utils';
import { HandPointUpRegular, Adjust } from '@vicons/fa';
import { useMessageStore } from '@/store/message';
import { debounce } from '@/utils/func';

const messageStore = useMessageStore()
const themeStore = useThemeStore()

const showBackTop = ref(false)
const SCROLL_DEBOUNCE_TIME = 150;

const handleScroll = () => {
  
  // 获取当前滚动距离 (垂直方向)
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  // console.log(scrollY);
  
  // 获取视口高度 (即 100vh 的实际像素值)
  const viewportHeight = window.innerHeight;

  // 如果滚动距离大于视口高度，则显示按钮
  showBackTop.value = scrollY > 1.5 * viewportHeight;
};

const debouncedHandleScroll = debounce(handleScroll, SCROLL_DEBOUNCE_TIME)
onMounted(() => {
  // 页面加载时执行一次，设置初始状态
  handleScroll();
  // 添加事件监听器
  window.addEventListener('scroll', debouncedHandleScroll, { passive: true });
  // 监听窗口大小变化，以防视口高度改变
  window.addEventListener('resize', debouncedHandleScroll, { passive: true });
});
onUnmounted(() => {
  // 组件卸载时移除监听器，防止内存泄漏
  window.removeEventListener('scroll', debouncedHandleScroll as any);
  window.removeEventListener('resize', debouncedHandleScroll as any);
});


const toggleTheme = () => {
  themeStore.toggleTheme
  const msg = themeStore.currentTheme === 'dark' ? '明亮' : '黑暗'
  themeStore.toggleTheme()
  messageStore.show(`已切换至${msg}模式`, 'info', 2000)
}
const backTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  })
  messageStore.show('已回到顶部', 'info', 2000)
}
</script>

<template>
  <div class="func-container">
    <icon title="回到顶部" class="icon-item" size="25px" @click="backTop" v-if="showBackTop" >
      <HandPointUpRegular />
    </icon>
    <icon title="切换主题" class="icon-item" size="25px" @click="toggleTheme">
      <Adjust />
    </icon>
  </div>
</template>

<style scoped>
.func-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: fixed;
  top: 75%;
  right: 20px;
  padding: 5px;
  z-index: 999;
}

.icon-item {
  margin-bottom: 20px;
}

.icon-item:hover {
  cursor: pointer;
}
</style>