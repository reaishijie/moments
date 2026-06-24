<script setup lang="ts" name="AvatarImage">
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  src?: string | null
  alt?: string
  fallback?: string
}>(), {
  alt: 'avatar',
  fallback: '/img/avatar.jpg'
})

const loadFailed = ref(false)
const source = computed(() => props.src?.trim())
const imageSrc = computed(() => {
  if (loadFailed.value) {
    return props.fallback
  }
  return source.value || props.fallback
})

watch(source, () => {
  loadFailed.value = false
})
</script>

<template>
  <img :src="imageSrc" :alt="alt" @error="loadFailed = true">
</template>
