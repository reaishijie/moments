<script setup lang="ts" name="Auth">
import { ref, onMounted, onUnmounted } from 'vue'
import type { emailLoginData, loginData, registerData, resetPasswordData } from '@/types/user'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'
import { register, resetPassword, sendEmailCode } from '@/api/auth'
import router from '@/router'
import { UserRegular, Fingerprint, EnvelopeRegular, Times, ShieldAlt } from '@vicons/fa'
import { Icon } from '@vicons/utils'
import { useAuthStore } from '@/store/auth'
import HCaptcha from '../captcha/HCaptcha.vue'
import { useDefaultStore } from '@/store/default'
const defaultStore = useDefaultStore()

onMounted(async () => {
    await defaultStore.getPublicConfig()
    userStatus.value = Number(defaultStore.configs.user_status)
})
const authStore = useAuthStore()
const messageStore = useMessageStore()
const userStore = useUserStore()

// 定义页面展示类型
const show = ref<'showLogin' | 'showRegister' | 'showForgot'>('showLogin')
const loginMode = ref<'password' | 'email'>('password')

// 定义输入数据
const userLoginInput = ref<loginData>({
    identifier: '',
    password: ''
})
const emailLoginInput = ref<emailLoginData>({
    email: '',
    code: ''
})

const userStatus = ref<number | 0>(0)
const userRegisterInput = ref<registerData>({
    username: '',
    password: '',
    email: '',
    code: '',
    status: userStatus.value
})
const resetPasswordInput = ref<resetPasswordData>({
    email: '',
    code: '',
    password: ''
})

// 从captcha组件传递过来的数据
const verifiedData = ref<{ status: boolean, message: string } | null>(null)
const onCaptchaVerified = (data: { status: boolean, message: string }) => {
    verifiedData.value = data
}

const needCaptcha = () => defaultStore.configs.user_captcha !== '0'
const captchaPassed = () => !needCaptcha() || verifiedData.value?.status
const needRegisterEmailVerify = () => defaultStore.configs.user_email_verify_register === '1'
const isValidEmail = (email?: string) => !!email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const sendCodeLoading = ref(false)
const codeCooldown = ref(0)
let codeCooldownTimer: ReturnType<typeof setInterval> | null = null

const startCodeCooldown = (seconds = 60) => {
    codeCooldown.value = seconds
    if (codeCooldownTimer) clearInterval(codeCooldownTimer)
    codeCooldownTimer = setInterval(() => {
        codeCooldown.value -= 1
        if (codeCooldown.value <= 0 && codeCooldownTimer) {
            clearInterval(codeCooldownTimer)
            codeCooldownTimer = null
        }
    }, 1000)
}

onUnmounted(() => {
    if (codeCooldownTimer) clearInterval(codeCooldownTimer)
})

const sendCode = async (email?: string) => {
    if (codeCooldown.value > 0) {
        messageStore.show(`请 ${codeCooldown.value}s 后再发送`, 'info', 2000)
        return
    }
    if (!isValidEmail(email)) {
        messageStore.show('请输入有效邮箱', 'info', 2000)
        return
    }
    sendCodeLoading.value = true
    const id = messageStore.show('正在发送验证码', 'loading')
    try {
        await sendEmailCode(email!.trim())
        startCodeCooldown()
        messageStore.update(id, { type: 'success', text: '验证码已发送', duration: 2000 })
    } catch (error: any) {
        messageStore.update(id, { type: 'error', text: error?.response?.data?.message || '发送失败', duration: 2000 })
    } finally {
        sendCodeLoading.value = false
    }
}

// 处理登录
const handleLogin = async () => {
    if (!captchaPassed()) {
        messageStore.show('请先完成验证', 'info', 2000)
        return
    }

    if (loginMode.value === 'email') {
        if (!isValidEmail(emailLoginInput.value.email) || !emailLoginInput.value.code) {
            messageStore.show('请输入邮箱和验证码', 'info', 2000)
            return
        }
        const id = messageStore.show('正在登录中', 'loading')
        try {
            const res = await userStore.handleEmailLogin(emailLoginInput.value)
            if (res.status === 0) {
                messageStore.update(id, { type: 'success', text: '登陆成功', duration: 2000 })
                authStore.closeAuth()
                router.push('/')
            } else {
                messageStore.update(id, { type: 'error', text: `${res.error.response.data.error}`, duration: 2000 })
            }
        } catch (error) {
            console.log(error);
            messageStore.update(id, { type: 'error', text: `网络异常`, duration: 2000 })
        }
        return
    }

    if (!userLoginInput.value.identifier || !userLoginInput.value.password) {
        messageStore.show('请输入登录信息', 'info', 2000)
        return
    }
    if ((userLoginInput.value.identifier !== 'admin' && userLoginInput.value.identifier.length < 6) || userLoginInput.value.password.length < 6) {
        messageStore.show('信息不能小于 6 位', 'info', 2000)
        return
    }

    let id = messageStore.show('正在登录中', 'loading')
    try {
        const res = await userStore.handleLogin(userLoginInput.value)
        // 如果请求成功
        if (res.status === 0) {
            messageStore.update(id, { type: 'success', text: '登陆成功', duration: 2000 })
            authStore.closeAuth()
            router.push('/')
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
    userRegisterInput.value.status = userStatus.value
    if (!captchaPassed()) {
        messageStore.show('请先完成验证', 'info', 2000)
        return
    }
    if (!userRegisterInput.value.username || !userRegisterInput.value.password) {
        messageStore.show('请输入注册信息', 'info', 2000)
        return
    }
    if (userRegisterInput.value.username.length < 6 || userRegisterInput.value.password.length < 6) {
        messageStore.show('信息不能小于 6 位', 'info', 2000)
        return
    }
    if (needRegisterEmailVerify() && (!isValidEmail(userRegisterInput.value.email) || !userRegisterInput.value.code)) {
        messageStore.show('请输入邮箱和验证码', 'info', 2000)
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

const handleResetPassword = async () => {
    if (!isValidEmail(resetPasswordInput.value.email) || !resetPasswordInput.value.code || !resetPasswordInput.value.password) {
        messageStore.show('请输入邮箱、验证码和新密码', 'info', 2000)
        return
    }
    if (resetPasswordInput.value.password.length < 6) {
        messageStore.show('密码不能小于 6 位', 'info', 2000)
        return
    }
    const id = messageStore.show('正在重置密码', 'loading')
    try {
        await resetPassword(resetPasswordInput.value)
        messageStore.update(id, { type: 'success', text: '密码已重置', duration: 2000 })
        show.value = 'showLogin'
        loginMode.value = 'password'
    } catch (error: any) {
        messageStore.update(id, { type: 'error', text: error?.response?.data?.error || '重置失败', duration: 2000 })
    }
}
</script>

<template>
    <div class="overlay" v-if="authStore.isShow">
        <!-- 用户登录 -->
        <div class="container" v-if="show === 'showLogin'">
            <div class="header">
                <div>
                    <p class="eyebrow">MOMENTS ACCOUNT</p>
                    <h2>欢迎回来</h2>
                    <span class="subtitle">选择你习惯的方式继续记录瞬刻</span>
                </div>
                <button class="close-button" aria-label="关闭登录窗口" @click="authStore.closeAuth">
                    <Icon class="icon">
                        <Times class="close" />
                    </Icon>
                </button>
            </div>
            <div class="tabs">
                <button :class="{ active: loginMode === 'password' }" @click="loginMode = 'password'">密码登录</button>
                <button :class="{ active: loginMode === 'email' }" @click="loginMode = 'email'">邮箱验证码</button>
            </div>
            <div class="body" v-if="loginMode === 'password'">
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
            <div class="body" v-else>
                <div class="identifier">
                    <label for="loginEmail">
                        <Icon class="icon">
                            <EnvelopeRegular />
                        </Icon>
                        邮箱：
                    </label>
                    <input type="email" id="loginEmail" v-model="emailLoginInput.email" placeholder="邮箱"
                        @keyup.enter="handleLogin">
                </div>
                <div class="identifier code-row">
                    <label for="loginCode">
                        <Icon class="icon">
                            <ShieldAlt />
                        </Icon>
                        验证码：
                    </label>
                    <input type="text" id="loginCode" v-model="emailLoginInput.code" placeholder="验证码"
                        @keyup.enter="handleLogin">
                    <button class="code-button" :disabled="sendCodeLoading || codeCooldown > 0" @click="sendCode(emailLoginInput.email)">
                        {{ codeCooldown > 0 ? `${codeCooldown}s` : '发送' }}
                    </button>
                </div>
            </div>
            <div class="captcha-wrap" v-if="defaultStore.configs.user_captcha !== '0'">
                <HCaptcha @verified="onCaptchaVerified" />
            </div>
            <div class="button">
                <button @click="handleLogin">登 录</button>
            </div>
            <div class="footer">
                <span @click="show = 'showForgot'">忘记密码</span> | <span
                    @click="show = 'showRegister'">注册账号</span>
            </div>
        </div>

        <!-- 用户注册 -->
        <div class="container" v-if="show === 'showRegister'">
            <div class="header">
                <div>
                    <p class="eyebrow">JOIN MOMENTS</p>
                    <h2>创建账号</h2>
                    <span class="subtitle">用邮箱守护你的账号与每一次发布</span>
                </div>
                <button class="close-button" aria-label="关闭注册窗口" @click="authStore.closeAuth">
                    <Icon class="icon">
                        <Times class="close" />
                    </Icon>
                </button>
            </div>
            <div class="body">
                <div class="identifier">
                    <label for="registerUsername">
                        <Icon class="icon">
                            <UserRegular />
                        </Icon>
                        账号：
                    </label>
                    <input type="text" id="registerUsername" v-model="userRegisterInput.username" placeholder="用户名"
                        @keyup.enter="handleRegister">
                </div>
                <div class="identifier">
                    <label for="email">
                        <Icon class="icon">
                            <EnvelopeRegular />
                        </Icon>
                        邮箱：
                    </label>
                    <input type="email" id="email" v-model="userRegisterInput.email" placeholder="邮箱"
                        @keyup.enter="handleRegister">
                </div>
                <div class="identifier code-row" v-if="needRegisterEmailVerify()">
                    <label for="registerCode">
                        <Icon class="icon">
                            <ShieldAlt />
                        </Icon>
                        验证码：
                    </label>
                    <input type="text" id="registerCode" v-model="userRegisterInput.code" placeholder="验证码"
                        @keyup.enter="handleRegister">
                    <button class="code-button" :disabled="sendCodeLoading || codeCooldown > 0" @click="sendCode(userRegisterInput.email)">
                        {{ codeCooldown > 0 ? `${codeCooldown}s` : '发送' }}
                    </button>
                </div>
                <div class="password">
                    <label for="registerPassword">
                        <Icon class="icon">
                            <Fingerprint />
                        </Icon>
                        密码：
                    </label>
                    <input type="password" id="registerPassword" v-model="userRegisterInput.password" placeholder="密码"
                        @keyup.enter="handleRegister">
                </div>
            </div>
            <div class="captcha-wrap" v-if="defaultStore.configs.user_captcha !== '0'">
                <HCaptcha @verified="onCaptchaVerified" />
            </div>
            <div class="button">
                <button @click="handleRegister">注 册</button>
            </div>
            <div class="footer">
                <span @click="show = 'showForgot'">忘记密码</span> | <span
                    @click="show = 'showLogin'">登录账号</span>
            </div>
        </div>

        <!-- 找回密码 -->
        <div class="container" v-if="show === 'showForgot'">
            <div class="header">
                <div>
                    <p class="eyebrow">ACCOUNT RECOVERY</p>
                    <h2>找回密码</h2>
                    <span class="subtitle">输入邮箱验证码后即可设置新密码</span>
                </div>
                <button class="close-button" aria-label="关闭找回密码窗口" @click="authStore.closeAuth">
                    <Icon class="icon">
                        <Times class="close" />
                    </Icon>
                </button>
            </div>
            <div class="body">
                <div class="identifier">
                    <label for="resetEmail">
                        <Icon class="icon">
                            <EnvelopeRegular />
                        </Icon>
                        邮箱：
                    </label>
                    <input type="email" id="resetEmail" v-model="resetPasswordInput.email" placeholder="注册邮箱"
                        @keyup.enter="handleResetPassword">
                </div>
                <div class="identifier code-row">
                    <label for="resetCode">
                        <Icon class="icon">
                            <ShieldAlt />
                        </Icon>
                        验证码：
                    </label>
                    <input type="text" id="resetCode" v-model="resetPasswordInput.code" placeholder="验证码"
                        @keyup.enter="handleResetPassword">
                    <button class="code-button" :disabled="sendCodeLoading || codeCooldown > 0" @click="sendCode(resetPasswordInput.email)">
                        {{ codeCooldown > 0 ? `${codeCooldown}s` : '发送' }}
                    </button>
                </div>
                <div class="password">
                    <label for="resetPassword">
                        <Icon class="icon">
                            <Fingerprint />
                        </Icon>
                        新密码：
                    </label>
                    <input type="password" id="resetPassword" v-model="resetPasswordInput.password" placeholder="新密码"
                        @keyup.enter="handleResetPassword">
                </div>
            </div>
            <div class="button">
                <button @click="handleResetPassword">重置密码</button>
            </div>
            <div class="footer">
                <span @click="show = 'showLogin'">返回登录</span> | <span
                    @click="show = 'showRegister'">注册账号</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.overlay {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background:
        radial-gradient(circle at 18% 18%, rgba(108, 173, 241, 0.28), transparent 28%),
        radial-gradient(circle at 82% 78%, rgba(22, 195, 106, 0.22), transparent 26%),
        rgba(10, 14, 24, 0.52);
    backdrop-filter: blur(10px);
    z-index: 999;
}

.container {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 1000;
    width: min(92vw, 410px);
    min-width: 300px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    background: color-mix(in srgb, var(--color-bg-app) 92%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-border) 72%, #6cadf1);
    border-radius: 22px;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.18);
    padding: 26px;
    color: var(--color-text-primary);
    transform: translate(-50%, -50%);
    animation: cardIn 0.34s ease-out;
}

.container::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 7px;
    background: linear-gradient(90deg, #6cadf1, #16c36a 46%, #f6c975 78%, #e133b6);
}

@keyframes cardIn {
    from {
        opacity: 0;
        transform: translate(-50%, -46%) scale(0.96);
    }

    to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }
}

.header {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    margin: 8px 0 20px;
}

.eyebrow {
    margin: 0 0 8px;
    font-size: 11px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: 0.16em;
    color: #6cadf1;
}

.header h2 {
    margin: 0;
    font-size: 30px;
    line-height: 1.12;
    letter-spacing: -0.04em;
}

.subtitle {
    display: inline-block;
    margin-top: 8px;
    font-size: 13px;
    color: #888;
}

.close-button {
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    min-width: 0;
    min-height: 0;
    margin: 0;
    display: grid;
    place-items: center;
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: var(--color-ad);
    color: var(--color-text-primary);
    transition: transform 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.close-button .icon {
    margin: 0;
}

.close-button:hover {
    cursor: pointer;
    color: #fff;
    background-color: #e133b6;
    transform: rotate(8deg) scale(1.04);
}

.tabs {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 5px;
    margin-bottom: 18px;
    border-radius: 999px;
    background: var(--color-ad);
}

.tabs button {
    width: 100%;
    min-width: 0;
    min-height: 36px;
    margin: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #888;
    font-size: 13px;
    font-weight: 700;
    transition: color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.tabs button.active {
    color: #fff;
    background: linear-gradient(135deg, #6cadf1, #16c36a);
    box-shadow: 0 8px 18px rgba(108, 173, 241, 0.25);
}

.body {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 12px;
}

.body > div {
    display: flex;
    align-items: center;
    min-height: 48px;
    padding: 0 12px;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    background: color-mix(in srgb, var(--color-bg-app) 84%, var(--color-ad));
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.body > div:focus-within {
    border-color: #6cadf1;
    box-shadow: 0 0 0 4px rgba(108, 173, 241, 0.14);
    transform: translateY(-1px);
}

label {
    flex: 0 0 86px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    line-height: 1;
    font-size: 13px;
    font-weight: 700;
    color: #586C97;
}

label:hover {
    cursor: pointer;
}

.icon {
    margin-right: 2px;
}

input {
    min-width: 0;
    flex: 1;
    height: 42px;
    padding: 0;
    border: none;
    outline: none;
    background: transparent;
    color: var(--color-text-primary);
    font-size: 14px;
}

input::placeholder {
    color: #888;
    font-size: 12px;
}

button {
    border: none;
    transition: transform 0.2s ease, background-color 0.2s ease, opacity 0.2s ease;
}

button:hover:not(:disabled) {
    cursor: pointer;
}

button:disabled {
    opacity: 0.62;
    cursor: not-allowed;
}

button:active:not(:disabled) {
    transform: scale(0.98);
}

.code-row input {
    max-width: none;
}

.code-button {
    flex: 0 0 auto;
    min-width: 60px;
    min-height: 30px;
    margin: 0 0 0 auto;
    border-radius: 999px;
    background: #6cadf1;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
}

.code-button:hover:not(:disabled) {
    background-color: #4e9be9;
}

.captcha-wrap {
    position: relative;
    z-index: 1;
    margin-top: 14px;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 16px;
    background: color-mix(in srgb, var(--color-bg-app) 78%, var(--color-ad));
}

.button {
    position: relative;
    z-index: 1;
    margin-top: 18px;
}

.button button {
    width: 100%;
    min-height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, #16c36a, #53b16a);
    color: #fff;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.16em;
    box-shadow: 0 12px 22px rgba(22, 195, 106, 0.22);
}

.button button:hover:not(:disabled) {
    background: linear-gradient(135deg, #08b75f, #6cadf1);
}

.footer {
    position: relative;
    z-index: 1;
    margin-top: 16px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #888;
}

.footer span {
    color: #6cadf1;
    transition: color 0.2s ease;
}

.footer span:hover {
    cursor: pointer;
    color: #e133b6;
}

@media (max-width: 480px) {
    .container {
        width: 92vw;
        padding: 22px 18px;
        border-radius: 18px;
    }

    .header h2 {
        font-size: 26px;
    }

    label {
        flex-basis: 78px;
    }
}

@media (prefers-reduced-motion: reduce) {
    .container,
    .body > div,
    .close-button,
    button {
        animation: none;
        transition: none;
    }
}
</style>