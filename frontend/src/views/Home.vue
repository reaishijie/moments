<script setup lang="ts" name="Home">
import { onMounted } from 'vue'
import Header from '@/components/Header.vue';
import Brief from '@/components/Brief.vue';
import ArticleList from '@/components/article/ArticleList.vue';
import HomeArticleItem from '@/components/article/HomeArticleItem.vue'
import { ChevronLeft, Cog } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import router from '@/router';
import { useUserStore } from '@/store/user';
import { useMessageStore } from '@/store/message';

const userStore = useUserStore()
const messageStore = useMessageStore()

onMounted(() => {
  if (!userStore.token) {
    userStore.handleLogout
    messageStore.show('请先登录账号', 'info', 2000)
    router.back()
  }
})
</script>

<template>
  <div class="container">
    <div id="top-bar">
      <Header>
        <template #left="{ isBlurred }">
          <div class="top-bar-left">
            <Icon :class="['icon', { blurred: isBlurred }]" @click="router.back()">
              <ChevronLeft />
            </Icon>
          </div>
        </template>

        <template #right="{ isBlurred }">
          <div class="profile">
            <Icon :class="['icon', { blurred: isBlurred }]" @click="router.push({ name: 'profile' })">
              <Cog />
            </Icon>
          </div>
        </template>
      </Header>
    </div>
    <!-- 修改背景暂不开发 | 用户中心已支持 -->
    <!-- <div class="changebackground">
      <Icon class="icon">
        <ImageRegular />
      </Icon>
    </div> -->
    <div class="brief">
      <Brief></Brief>
    </div>
    <div class="content">
      <ArticleList>
        <template #default="{article}">
          <HomeArticleItem 
          :article="article"
          />
        </template>
      </ArticleList>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-width: 375px;
  width: 520px;
  min-height: 100vh;
  background: rgb(255, 255, 255);
}

/* bar的图标 */
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

.changebackground {
  margin-top: -30px;
  margin-left: 10px;
  z-index: 5;
}
/* 内容 */
.content {
  display: flex;
  flex-direction: row;
  width: 100%;
}
</style>