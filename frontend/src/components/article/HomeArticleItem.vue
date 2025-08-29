<script setup lang="ts" name="">
import {  } from 'vue'
const props = defineProps({
    article: {
        type: Object,
        required: true
    }
})
console.log(props);

</script>

<template>
  {{ article.id }}
</template>

<style scoped>
  
</style>