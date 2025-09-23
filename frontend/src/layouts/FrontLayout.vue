<script setup lang="ts" name="FrontLayout">
import { RouterView } from 'vue-router';
import { useDefaultStore } from '@/store/default';
import { computed, onMounted } from 'vue';

const defaultStore = useDefaultStore()
onMounted(() => {
  defaultStore.getPublicConfig()
})
// 背景样式
const backgroundStyle = computed(() => {
  const backgroundValue = defaultStore.configs.site_background;

  if (backgroundValue) {
    if (backgroundValue.includes('gradient')) {
      // 渐变背景
      return { backgroundImage: backgroundValue, backgroundColor: undefined };
    } else if (backgroundValue.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      // 纯色背景
      return { backgroundImage: undefined, backgroundColor: backgroundValue };
    } else {
      // 图片背景
      return { backgroundImage: `url("${backgroundValue}")`, backgroundColor: undefined };
    }
  } else {
    // 默认背景
    return { backgroundImage: undefined, backgroundColor: '#f0f0f0' };
  }
});
</script>

<template>
  <div class="front-container" :style="backgroundStyle">
    <div>
    </div>
    <div class="app-container">
      <RouterView />
    </div>
    <div>
    </div>
  </div>
</template>

<style scoped>
.front-container {
  display: flex;
  flex-direction: row;
  background-size: cover;
  /* 覆盖整个容器 */
  background-position: center;
  /* 图像居中显示 */
  background-repeat: no-repeat;
  /* 不重复 */
  background-attachment: fixed;
  /* 背景固定，内容滚动 */
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 300px;
  max-width: 520px;
  width: 100%;
  margin: 0 auto;
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>