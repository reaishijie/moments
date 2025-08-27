<script setup lang="ts" name="Profile">
import { computed, reactive } from 'vue'
import { ChevronLeft, ChevronRight } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import router from '@/router';
import { useUserStore } from '@/store/user';
import { useMessageStore } from '@/store/message';

const userStore = useUserStore()
const messageStore = useMessageStore()
const states = reactive({
  avatar: false,
  role: false,
  status: false,
  nickname: false,
  username: false,
  email: false,
  brief: false,
})
const userData = reactive({
  avatar: computed( () => userStore.profile?.avatar ?? '/img/avatar.jpg'),
  role: computed( () => Number(userStore.profile?.role) === 1 ? '管理员' : '用户'),
  status: computed( () => Number(userStore.profile?.status) === 1 ? '正常' : '异常'),
  nickname: computed( () => userStore.profile?.nickname ?? '未设置'),
  username: computed( () => userStore.profile?.username),
  email: computed( () => userStore.profile?.email ?? '未绑定'),
  brief: computed( () => userStore.profile?.brief ?? '未设置'),
})

if (!userStore.token) {
  messageStore.show('请先登录账户', 'info', 2000)
  userStore.handleLogout()
  router.replace('/')
}
function handleLogout() {
  userStore.handleLogout()
  messageStore.show('已退出登录', 'success', 2000)
  router.replace('/')
}
</script>

<template>
  <div class="main-container">
    <div class="header">
      <div id="back" @click="router.back()">
        <Icon>
          <ChevronLeft />
        </Icon>
      </div>
      <div>用户资料</div>
    </div>
    <div class="body">

      <div class="body-item" @click="states.avatar = !states.avatar">
        <div class="body-item-left">头像</div>
        <div class="body-item-right">
          <img :src="userData.avatar" alt="avatar" style="width: 35px;">
          <Icon :class="['icon', { 'rotate-icon': states.avatar }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.avatar" class="input">
        <input type="text" placeholder="请输入 新头像url">
        <button>更新</button>
      </div>

      <div class="body-item">
        <div class="body-item-left">角色</div>
        <div class="body-item-right">
          {{ userData.role }}
          <Icon :class="['icon', { 'rotate-icon': states.role }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>

      <div class="body-item" @click="states.status = !states.status" v-if="Number(states.role) ===1">
        <div class="body-item-left">状态</div>
        <div class="body-item-right">
          {{ userData.status }}
          <Icon :class="['icon', { 'rotate-icon': states.status }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.status " class="input">
        <select name="status" id="status">
          <option value=""></option>
          <option value="0">封禁</option>
          <option value="1">正常</option>
        </select>
        <input type="text" placeholder="请输入 状态码">
        <button>更新</button>
      </div>

      <div class="body-item" @click="states.nickname = !states.nickname">
        <div class="body-item-left">昵称</div>
        <div class="body-item-right">
          {{ userData.nickname }}
          <Icon :class="['icon', { 'rotate-icon': states.nickname }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.nickname" class="input">
        <input type="text" placeholder="请输入 昵称">
        <button>更新</button>
      </div>

      <div class="body-item" @click="states.username = !states.username">
        <div class="body-item-left">账号</div>
        <div class="body-item-right">
          {{ userData.username}}
          <Icon :class="['icon', { 'rotate-icon': states.username }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.username" class="input">
        <input type="text" placeholder="请输入 用户名" readonly>
        <!-- <button>更新</button> -->
      </div>

      <div class="body-item" @click="states.email = !states.email">
        <div class="body-item-left">邮箱</div>
        <div class="body-item-right">
          {{ userData.email }}
          <Icon :class="['icon', { 'rotate-icon': states.email }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.email" class="input">
        <input type="text" placeholder="请输入 邮箱">
        <button>更新</button>
      </div>

      <div class="body-item" @click="states.brief = !states.brief">
        <div class="body-item-left">签名</div>
        <div class="body-item-right">
          {{ userData.brief }}
          <Icon :class="['icon', { 'rotate-icon': states.brief }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.brief" class="input">
        <input type="text" placeholder="请输入 签名">
        <button>更新</button>
      </div>

      <div class="body-logout" @click="handleLogout">
        <div>退出登录</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-width: 375px;
  width: 520px;
}

/* 头部栏 */
.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 6vh;
  color: #00000098;
  background: #f0f0f0e0;
}

#back {
  padding: 10px;
  margin: 1px;
}

#back:hover {
  color: #000000fb;
  background: #f0f0f08b;
  cursor: pointer;
  border-radius: 10px;
}

/* 主体 */
.body {
  display: flex;
  flex-direction: column;
  /* width: min(100%,520px); */
  width: 100%;
  background: rgb(252, 252, 252);
}

.body-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 0.6px 0 0 #cccccc62;
  padding: 10px 0 10px 0;
  color: #000000cd;
  font-size: small;
}

.body-item-left {
  margin-left: 20px;
}

.body-item-right {
  margin-right: 10px;
  display: flex;
  align-items: center;
  color: #0000004f;
}

.body-item-right:hover {
  cursor: pointer;
}

.body-item-left:hover {
  cursor: pointer;
}

.body-logout {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 -10px 0 0 #cccccc62;
  margin-top: 10px;
  padding: 5px;
  font: small;
  color: #000000bb;
}

.body-logout:hover {
  color: #d0c2c2;
}

/* 修改信息输入框 */
.input {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

input {
  border: none;
  outline: none;
  padding: 5px;
  margin-left: 15px;
  margin-bottom: 5px;
  margin-top: 5px;
  color: #338ae7;
  width: 75%;
  border-radius: 3px;
}

button {
  align-self: flex-end;
  margin-top: 5px;
  margin-bottom: 5px;
  margin-right: 15px;
  color: white;
  background: #09C362;
  border-radius: 5px;
  border: none;
  padding: 5px 15px;
}

button:hover {
  background: #f8bc99;
}

.icon {
  padding: 5px 0 5px 0;
  margin-left: 5px;
  line-height: 1;
  font-size: 10px;
}

.rotate-icon {
  transition: transform 0.3s ease;
  transform: rotate(90deg);
}
</style>