<script setup lang="ts" name="EmojiText">
import { computed } from 'vue'
import { parseEmojiText } from '@/config/emojis'

const props = defineProps<{
  text?: string | null
}>()

const segments = computed(() => parseEmojiText(props.text || ''))
</script>

<template>
  <span class="emoji-text">
    <template v-for="(segment, index) in segments" :key="`${segment.value}-${index}`">
      <img
        v-if="segment.type === 'emoji' && segment.emoji"
        class="emoji-img"
        :src="segment.emoji.url"
        :alt="segment.emoji.name"
        :title="segment.emoji.name"
        loading="lazy"
      >
      <span v-else>{{ segment.value }}</span>
    </template>
  </span>
</template>

<style scoped>
.emoji-text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.emoji-img {
  width: 22px;
  height: 22px;
  margin: 0 1px;
  vertical-align: -5px;
  object-fit: contain;
}
</style>
