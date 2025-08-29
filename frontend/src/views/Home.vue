<script setup lang="ts" name="Home">
import { } from 'vue'
import Header from '@/components/Header.vue';
import { ChevronLeft, UserCog } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import router from '@/router';
</script>

<template>
  <div class="container">
    <div id="top-bar">
      <Header>
        <template #left="{ isBlurred }">
          <div class="top-bar-left">
            <Icon :class="['icon', { blurred: isBlurred }]"  @click="router.back()">
              <ChevronLeft/>
            </Icon>
          </div>
        </template>

        <template #right="{ isBlurred }">
          <!-- <div class="addArticle">
            <Icon :class="['icon', { blurred: isBlurred }]">
              <UserCog />
            </Icon>
          </div> -->
          <div class="profile">
            <Icon :class="['icon', { blurred: isBlurred }]" @click="router.push({ name: 'profile'})">
              <UserCog />
            </Icon>
          </div>
        </template>
      </Header>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-width: 375px;
  width: 520px;
}

.icon {
  font-size: 20px;
  color: rgb(238, 233, 233);
  margin: 3px;
}

.icon:hover {
  color: rgb(200, 194, 194);
  cursor: pointer;
}

.icon.blurred {
  font-size: 20px;
  color: black;
}

.icon.blurred:hover {
  color: rgb(81, 78, 78);
}

.addArticle {
  padding: 0 10px 0 0;
}
</style>