<script setup lang="ts" name="App">
import { RouterView } from 'vue-router';
const description = import.meta.env.VITE_API_BASE_URL
console.log('@@@',description)
</script>

<template>
  <RouterView />
</template>

<style scoped>
  
</style>