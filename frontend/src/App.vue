<script setup lang="ts" name="App">
import { RouterView } from 'vue-router';
import MessageList from '@/components/MessageList.vue'
import Auth from './components/user/Auth.vue';
</script>

<template>
  <div class="app-container">
    <RouterView />
    <MessageList />
    <Auth />
  </div>
</template>

<style scoped>
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