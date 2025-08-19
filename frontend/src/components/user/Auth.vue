<script setup lang="ts" name="Auth">
import { ref } from 'vue'
import type { loginData, registerData } from '@/types/user'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'
import { register } from '@/api/auth'
import router from '@/router'
import { UserRegular, Fingerprint, EnvelopeRegular, Times } from '@vicons/fa'
import { Icon } from '@vicons/utils'
import { useAuthStore } from '@/store/auth'


const authStore = useAuthStore()
const messageStore = useMessageStore()
const userStore = useUserStore()

// 定义页面展示类型
const show = ref<'showLogin' | 'showRegister'>('showLogin')

// 定义输入数据
const userLoginInput = ref<loginData>({
    identifier: '',
    password: ''
})

const userRegisterInput = ref<registerData>({
    username: '',
    password: '',
    email: ''
})
// 处理登录
const handleLogin = async () => {
    if (!userLoginInput.value.identifier || !userLoginInput.value.password) {
        messageStore.show('请输入登录信息', 'info', 2000)
        return
    }
    if (userLoginInput.value.identifier.length < 6 || userLoginInput.value.password.length < 6) {
        messageStore.show('信息不能小于 6 位', 'info', 2000)
        return
    }

    let id = messageStore.show('正在登录中', 'loading')
    try {
        const res = await userStore.handleLogin(userLoginInput.value)
        // 如果请求成功
        if (res.status === 0) {
            messageStore.update(id, { type: 'success', text: '登陆成功', duration: 2000 })
            router.replace('/')
        }
        else {
            messageStore.update(id, { type: 'error', text: `${res.error.response.data.error}`, duration: 2000 })
        }
    } catch (error) {
        console.log(error);

        messageStore.update(id, { type: 'error', text: `网络异常`, duration: 2000 })
    }
}
// 处理注册
const handleRegister = async () => {
    if (!userRegisterInput.value.username || !userRegisterInput.value.password) {
        messageStore.show('请输入注册信息', 'info', 2000)
        return
    }
    if (userRegisterInput.value.username.length < 6 || userRegisterInput.value.password.length < 6) {
        messageStore.show('信息不能小于 6 位', 'info', 2000)
        return
    }

    let id = messageStore.show('正在注册中', 'loading')
    try {
        // 用注册函数等待结果
        const response = await register(userRegisterInput.value)
        // 判断是否成功
        if (response) {
            messageStore.update(id, { type: 'success', text: '注册成功', duration: 2000 })
            show.value = 'showLogin'
        } else {
            messageStore.update(id, { type: 'error', text: '注册失败', duration: 2000 })
        }
    } catch (error: any) {
        console.error('注册过程中发生错误:', error);
        messageStore.update(id, { type: 'error', text: `${error.response.data.error}`, duration: 2000 });
    }
}
</script>

<template>
    <div class="overlay" v-if="authStore.isShow">
        <!-- 用户登录 -->
        <div class="container" v-if="show === 'showLogin'">
            <div class="header">
                <span>用户登录</span>
                <Icon class="icon" @click="authStore.closeAuth" >
                    <Times class="close" />
                </Icon>
            </div>
            <div class="body">
                <div class="identifier">
                    <label for="identifier">
                        <Icon class="icon">
                            <UserRegular />
                        </Icon>
                        账号：
                    </label>
                    <input type="text" id="identifier" v-model="userLoginInput.identifier" placeholder="用户名/邮箱"
                        @keyup.enter="handleLogin">
                </div>
                <div class="password">
                    <label for="password">
                        <Icon class="icon">
                            <Fingerprint />
                        </Icon>
                        密码：
                    </label>
                    <input type="password" id="password" v-model="userLoginInput.password" placeholder="密码"
                        @keyup.enter="handleLogin">
                </div>
            </div>
            <div class="button">
                <button @click="handleLogin">登 录</button>
            </div>
            <div class="footer">
                <span @click="messageStore.show('请联系管理员', 'info', 2000)">忘记密码</span> | <span
                    @click="show = 'showRegister'">注册账号</span>
            </div>
        </div>

        <!-- 用户注册 -->
        <div class="container" v-if="show === 'showRegister'">
            <div class="header">
                <span>用户注册</span>
                <Icon class="icon" @click="authStore.closeAuth">
                    <Times class="close" />
                </Icon>
            </div>
            <div class="body">
                <div class="identifier">
                    <label for="identifier">
                        <Icon class="icon">
                            <UserRegular />
                        </Icon>
                        账号：
                    </label>
                    <input type="text" id="identifier" v-model="userRegisterInput.username" placeholder="用户名"
                        @keyup.enter="handleLogin">
                </div>
                <div class="identifier">
                    <label for="email">
                        <Icon class="icon">
                            <EnvelopeRegular />
                        </Icon>
                        邮箱：
                    </label>
                    <input type="text" id="email" v-model="userRegisterInput.email" placeholder="邮箱"
                        @keyup.enter="handleLogin">
                </div>
                <div class="password">
                    <label for="password">
                        <Icon class="icon">
                            <Fingerprint />
                        </Icon>
                        密码：
                    </label>
                    <input type="password" id="password" v-model="userRegisterInput.password" placeholder="密码"
                        @keyup.enter="handleLogin">
                </div>
            </div>
            <div class="button">
                <button @click="handleRegister">注 册</button>
            </div>
            <div class="footer">
                <span @click="messageStore.show('请联系管理员', 'info', 2000)">忘记密码</span> | <span
                    @click="show = 'showLogin'">登录账号</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
@media (max-width: 480px) {
    .container {
        width: 90%;
        padding: 16px;
    }
}

/* 遮罩层 */
.overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.4);
    /* 半透明黑色背景 */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
}

.container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-width: 320px;
    max-width: 440px;
    background-color: rgba(255, 255, 255, 0.95);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 0 12px rgba(0, 0, 0, 0.2);
}

/* 淡入动画 */
@keyframes flipIn {
    from {
        transform: translate(-50%, -50%) rotateY(90deg);
        opacity: 0;
    }

    to {
        transform: translate(-50%, -50%) rotateY(0deg);
        opacity: 1;
    }
}

.container {
    animation: flipIn 0.4s ease-out;
    transform-style: preserve-3d;
    backface-visibility: hidden;
}

/* 头部：用户注册、用户登录 */
.header {
    width: 100%;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    font-size: large;
    font-weight: 900;
    color: rgb(246, 201, 117);
}
.close:hover {
    cursor: pointer;
    color: rgb(237, 172, 51);
    font-size: x-large;
}
label {
    display: inline-block;
    width: 80px;
    line-height: 30px;
}

label:hover {
    cursor: pointer;
}

.icon {
    margin-right: 5px;
}

input {
    background-color: inherit;
    margin-bottom: 15px;
    border: none;
    line-height: 20px;
    font-size: smaller;
    border-bottom: 1px solid #cac5c5;
    /* 只保留底部边框 */
    padding: 8px;
    /* 内边距 */
    outline: none;
    /* 去掉聚焦时的轮廓 */
    transition: border-color 0.3s;
    /* 过渡效果 */
}

input:focus {
    border-bottom: 2px solid #eadfdf;
}

input::placeholder {
    font-size: 10px;
    /* 调整字体大小 */
    color: #888;
    /* 可选：调整颜色 */
    font-style: italic;
    /* 可选：调整字体样式 */
}

button {
    margin-top: 10px;
    min-width: 200px;
    max-width: 440px;
    min-height: 30px;
    max-height: 40px;
    border-radius: 25px;
    background-color: rgb(22, 195, 106);
    color: whitesmoke;
}

button:hover {
    background-color: rgb(5, 229, 109);
    /* 悬浮时按钮颜色 */
    cursor: pointer;
}

button:active {
    transform: scale(0.98);
    /* 按钮点击时缩小 */
}

.footer {
    font-size: xx-small;
    margin-top: 12px;
    font-weight: 200;
    color: #e133b6;
}

.footer span:hover {
    cursor: pointer;
    color: #ef81d3;

}
</style>