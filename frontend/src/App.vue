<script setup lang="ts" name="App">
import { RouterView } from 'vue-router';
import MessageList from '@/components/MessageList.vue'
import Auth from './components/user/Auth.vue';
</script>

<template>
  <RouterView />
  <MessageList />
  <Auth />
</template>

<style scoped>
  
</style>