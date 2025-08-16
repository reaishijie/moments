<script setup lang="ts" name="App">
import { RouterView } from 'vue-router';
import MessageList from '@/components/MessageList.vue'

/**demo */
import { useMessageStore } from '@/store/message'
const messageStore = useMessageStore()

function demo() {
  const id = messageStore.show('不限时loading', 'loading')
  setTimeout(() => {
    messageStore.update(id, {text: 'demo update', type:'success',duration:2000})
  }, 2000);
}
</script>

<template>
  <RouterView />
  <MessageList />
  <button @click="messageStore.show('测试成功弹出success', 'success', 2000)"> 弹出success</button>
  <button @click="messageStore.show('测试成功弹出error', 'error', 2000)"> 弹出error</button>
  <button @click="messageStore.show('测试成功弹出info', 'info', 2000)"> 弹出info</button>
  <button @click="messageStore.show('测试成功弹出loading', 'loading', 2000)"> 弹出loading</button>
  <button @click="messageStore.show('不限时loading', 'loading')"> 弹出loading</button>
  <button @click="demo"> demo </button>

</template>

<style scoped>
  
</style>