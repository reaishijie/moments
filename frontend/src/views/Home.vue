<script setup lang="ts" name="Home">
import {  } from 'vue'
import Header from '@/components/Header.vue';
</script>

<template>
  <div class="main-container">
    <Header />
  </div>
</template>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-width: 375px;
  width: 520px;
  height: 100vh;
}
</style>