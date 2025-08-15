<script setup lang="ts" name="App">
import { RouterView } from 'vue-router';
import MessageList from '@/components/MessageList.vue'

/**demo */
import { useMessageStore } from '@/store/message'
const messageStore = useMessageStore()

</script>

<template>
  <RouterView />
  <MessageList />
  <button @click="messageStore.show('测试成功弹出success', 'success', 2000)"> 弹出success</button>
  <button @click="messageStore.show('测试成功弹出error', 'error', 2000)"> 弹出error</button>
  <button @click="messageStore.show('测试成功弹出info', 'info', 2000)"> 弹出info</button>
  <button @click="messageStore.show('测试成功弹出loading', 'loading', 2000)"> 弹出loading</button>

</template>

<style scoped>
  
</style>