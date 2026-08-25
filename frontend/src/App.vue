<script setup lang="ts" name="App">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router';
import MessageList from '@/components/MessageList.vue'
import Auth from './components/user/Auth.vue';
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

onMounted(() => {
  void userStore.restoreSession()
})
</script>

<template>
  <RouterView />
  <MessageList />
  <Auth />
</template>

<style scoped></style>