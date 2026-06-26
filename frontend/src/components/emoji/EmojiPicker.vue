<script setup lang="ts" name="EmojiPicker">
import { computed, onBeforeUnmount, ref } from 'vue'
import { emojiGroups, type EmojiItem } from '@/config/emojis'

withDefaults(defineProps<{
  placement?: 'top' | 'bottom'
}>(), {
  placement: 'top'
})

const emit = defineEmits<{
  select: [code: string, emoji: EmojiItem]
}>()

const isOpen = ref(false)
const activeGroupKey = ref(emojiGroups[0]?.key || '')
const pickerRef = ref<HTMLElement | null>(null)
const activeGroup = computed(() => emojiGroups.find(group => group.key === activeGroupKey.value) || emojiGroups[0])

function togglePanel() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    window.setTimeout(() => document.addEventListener('click', handleOutsideClick), 0)
  } else {
    document.removeEventListener('click', handleOutsideClick)
  }
}

function handleOutsideClick(event: MouseEvent) {
  if (!pickerRef.value?.contains(event.target as Node)) {
    isOpen.value = false
    document.removeEventListener('click', handleOutsideClick)
  }
}

function selectEmoji(emoji: EmojiItem) {
  emit('select', emoji.code, emoji)
  isOpen.value = false
  document.removeEventListener('click', handleOutsideClick)
}

onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick))
</script>

<template>
  <div ref="pickerRef" class="emoji-picker">
    <button type="button" class="emoji-trigger" title="添加表情" @click.stop="togglePanel">☺</button>
    <div v-if="isOpen" :class="['emoji-panel', `emoji-panel-${placement}`]" @click.stop>
      <div class="emoji-grid">
        <button
          v-for="emoji in activeGroup?.emojis"
          :key="emoji.code"
          type="button"
          class="emoji-option"
          :title="emoji.name"
          @click="selectEmoji(emoji)"
        >
          <img :src="emoji.url" :alt="emoji.name" loading="lazy">
        </button>
      </div>
      <div class="emoji-tabs">
        <button
          v-for="group in emojiGroups"
          :key="group.key"
          type="button"
          :class="['emoji-tab', { active: group.key === activeGroupKey }]"
          @click="activeGroupKey = group.key"
        >
          {{ group.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.emoji-picker {
  position: relative;
  display: inline-flex;
}

.emoji-trigger {
  width: 30px;
  height: 28px;
  border: none;
  border-radius: 5px;
  background: rgba(128, 128, 128, 0.075);
  color: #6cadf1;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.emoji-trigger:hover {
  background-color: var(--color-ad-hover);
  color: #f8a778;
}

.emoji-panel {
  position: absolute;
  left: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  width: min(248px, calc(100vw - 32px));
  max-height: min(360px, 58vh);
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-review);
  box-shadow: var(--color-shadow);
  box-sizing: border-box;
}

.emoji-panel-top {
  bottom: calc(100% + 8px);
}

.emoji-panel-bottom {
  top: calc(100% + 8px);
}

.emoji-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(54px, 1fr));
  gap: 6px;
  margin-top: 8px;
  overflow: visible;
}

.emoji-tab {
  min-width: 0;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  background: var(--color-ad);
  color: var(--color-text-primary);
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}

.emoji-tab.active,
.emoji-tab:hover {
  background: #6cadf1;
  color: #fff;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 6px;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 2px;
}

.emoji-option {
  width: 100%;
  height: 34px;
  border: none;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
}

.emoji-option:hover {
  background: var(--color-ad);
}

.emoji-option img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}
</style>
