<script setup lang="ts" name="Login">
import { ref } from 'vue'
import type { loginData } from '@/types/user'
import { useUserStore } from '@/store/user'
const userStore = useUserStore()
// 定义输入数据
const userLoginInput = ref<loginData>({
    identifier: '',
    password: ''
})
function handleLogin() {
    console.log(userLoginInput.value);
    userStore.handleLogin(userLoginInput.value)
}
</script>

<template>
    <div class="container">
        <div class="header">
            用户登录
        </div>
        <div class="body">
            <div class="identifier">
                <label for="identifier">用户名：</label>
                <input type="text" id="identifier" v-model="userLoginInput.identifier" placeholder="用户名/邮箱" @keyup.enter="handleLogin">
            </div>
            <div class="password">
                <label for="password">密 码：</label>
                <input type="password" id="password" v-model="userLoginInput.password" placeholder="密码" @keyup.enter="handleLogin">
            </div>
        </div>
        <div class="button">
            <button @click="handleLogin">登 录</button>
        </div>
        <div class="footer">
            <span>忘记密码</span>  |  <span>注册账号</span>
        </div>
    </div>

</template>

<style scoped>
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    /* min-height: 20vh; */
    min-width: 320px;
    max-width: 440px;
    flex-direction: column;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 8px skyblue;
}
.header {
    margin-bottom: 20px;
    display: flex;
    /* align-self: start; */
    font-size: large;
    font-weight: 900;
    color: rgb(246, 201, 117);
}
label {
    display: inline-block;
    width: 70px;
}
input {
    background-color: inherit;
    margin-bottom: 10px;
    border: none;
    font-size: smaller;
    border-bottom: 1px solid #cac5c5; /* 只保留底部边框 */
    padding: 8px; /* 内边距 */
    outline: none; /* 去掉聚焦时的轮廓 */
    transition: border-color 0.3s; /* 过渡效果 */
}
input:focus {
    border-bottom: 2px solid #eadfdf;
}
input::placeholder {
  font-size: 10px;    /* 调整字体大小 */
  color: #888;        /* 可选：调整颜色 */
  font-style: italic; /* 可选：调整字体样式 */
}
button {
    margin-top: 10px;
    min-width: 200px;
    max-width: 440px;
    min-height: 30px;
    max-height: 40px;
    border-radius: 25px;
    background-color: rgb(22, 195, 106);
}
button:hover {
    background-color: rgb(5, 229, 109); /* 悬浮时按钮颜色 */
}

button:active {
    transform: scale(0.98); /* 按钮点击时缩小 */
}

.footer {
    font-size: xx-small;
    margin-top: 10px;
}
</style>