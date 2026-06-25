<script setup lang="ts" name="FrontLayout">
import { RouterView } from 'vue-router';
import { useDefaultStore } from '@/store/default';
import { computed, onMounted, onUnmounted, watch } from 'vue';
import Func from '@/components/utils/Func.vue';
import { useThemeStore } from '@/store/theme';

const themeStore =useThemeStore()
const defaultStore = useDefaultStore()
const customFontFamily = 'MomentsCustomFont'
const customFontStyleId = 'moments-custom-font-style'

onMounted(() => {
  defaultStore.getPublicConfig()
})

onUnmounted(() => {
  document.getElementById(customFontStyleId)?.remove()
})

const normalizeFontConfig = (value?: string) => value?.trim() || ''

type FontConfig =
  | { type: 'family'; family: string }
  | { type: 'file'; url: string }
  | { type: 'css'; url: string; family: string }

const isFontUrl = (value: string) => {
  return /^(https?:)?\/\//i.test(value) || /\.(woff2?|ttf|otf|eot)(\?.*)?$/i.test(value)
}

const getFontFormat = (value: string) => {
  const url = value.split('?')[0].toLowerCase()
  if (url.endsWith('.woff2')) return 'woff2'
  if (url.endsWith('.woff')) return 'woff'
  if (url.endsWith('.ttf')) return 'truetype'
  if (url.endsWith('.otf')) return 'opentype'
  if (url.endsWith('.eot')) return 'embedded-opentype'
  return 'woff2'
}

const escapeCssString = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const quoteFontFamily = (value: string) => {
  const family = value.trim()
  if (!family) return 'sans-serif'
  if (family.includes(',') || /^['"]/.test(family)) return family
  return `"${escapeCssString(family)}", sans-serif`
}

const parseFontConfig = (value?: string): FontConfig | null => {
  const fontValue = normalizeFontConfig(value)
  if (!fontValue) return null

  const cssConfig = fontValue.match(/^css:(.+?)\|(.+)$/i)
  if (cssConfig) {
    return { type: 'css', url: cssConfig[1].trim(), family: quoteFontFamily(cssConfig[2]) }
  }

  const importConfig = fontValue.match(/^@import\s+url\((?:['"])?(.+?)(?:['"])?\)\s*;?\s*(.+)$/i)
  if (importConfig) {
    return { type: 'css', url: importConfig[1].trim(), family: quoteFontFamily(importConfig[2]) }
  }

  if (isFontUrl(fontValue)) {
    return { type: 'file', url: fontValue }
  }

  return { type: 'family', family: fontValue }
}

const fontStyle = computed(() => {
  const fontConfig = parseFontConfig(defaultStore.configs.site_font)
  if (!fontConfig) return {}

  if (fontConfig.type === 'file') {
    return { fontFamily: `"${customFontFamily}", sans-serif` }
  }

  return { fontFamily: fontConfig.family }
})

watch(
  () => defaultStore.configs.site_font,
  (value) => {
    const fontConfig = parseFontConfig(value)
    let styleEl = document.getElementById(customFontStyleId) as HTMLStyleElement | null

    if (!fontConfig || fontConfig.type === 'family') {
      styleEl?.remove()
      return
    }

    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = customFontStyleId
      document.head.appendChild(styleEl)
    }

    styleEl.textContent = fontConfig.type === 'css'
      ? `@import url("${escapeCssString(fontConfig.url)}");`
      : `
@font-face {
  font-family: "${customFontFamily}";
  src: url("${escapeCssString(fontConfig.url)}") format("${getFontFormat(fontConfig.url)}");
  font-display: swap;
}
`
  },
  { immediate: true }
)
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
    const defaultColor = themeStore.defaultOutsideBgColor;
    return { backgroundImage: undefined, backgroundColor: defaultColor };
  }
});
</script>

<template>
  <Func />
  <div class="front-container" :style="[backgroundStyle, fontStyle]">
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
  color: var(--color-text-primary);
  background-color: var(--color-bg-outside);
  transition: background-color 0.3s ease-in, color 1s ease;
  box-shadow: var(--color-shadow);
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-width: 300px;
  max-width: 520px;
  width: 100%;
  margin: 0 auto;
  background-color: var(--color-bg-app);
  transition: background-color 0.5s ease;
}
</style>