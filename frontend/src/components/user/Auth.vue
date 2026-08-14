<script setup lang="ts" name="Auth">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { emailLoginData, loginData, registerData, resetPasswordData } from '@/types/user'
import { useUserStore } from '@/store/user'
import { useMessageStore } from '@/store/message'
import { bindOAuthAccount, getApiBaseUrl, register, registerAndBindOAuth, resetPassword, sendEmailCode, type OAuthCallbackPayload, type OAuthProfile, type OAuthProvider } from '@/api/auth'
import router from '@/router'
import { UserRegular, Fingerprint, EnvelopeRegular, Times, ShieldAlt, EyeRegular, EyeSlashRegular } from '@vicons/fa'
import { Icon } from '@vicons/utils'
import { useAuthStore } from '@/store/auth'
import Captcha from '../captcha/Captcha.vue'
import { useDefaultStore } from '@/store/default'
const defaultStore = useDefaultStore()

onMounted(async () => {
    await defaultStore.getPublicConfig()
    userStatus.value = Number(defaultStore.configs.user_status)
    userRegisterInput.value.status = userStatus.value
    oauthRegisterInput.value.status = userStatus.value
    window.addEventListener('message', handleOAuthMessage)
    consumeStoredOAuthResult()
})
const authStore = useAuthStore()
const messageStore = useMessageStore()
const userStore = useUserStore()

// 定义页面展示类型
const show = ref<'showLogin' | 'showRegister' | 'showForgot' | 'showOauthBind' | 'showOauthConfirm'>('showLogin')
const loginMode = ref<'password' | 'email'>('password')
const showLoginPassword = ref(false)
const showRegisterPassword = ref(false)
const showResetPassword = ref(false)

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
const oauthTicket = ref('')
const oauthProfile = ref<OAuthProfile | null>(null)
const oauthRegisterInput = ref<registerData>({
    username: '',
    password: '',
    email: '',
    code: '',
    status: userStatus.value
})

// 从captcha组件传递过来的数据
const verifiedData = ref<{ status: boolean, message: string, captchaProof?: string } | null>(null)
const captchaRef = ref<InstanceType<typeof Captcha> | null>(null)
const onCaptchaVerified = (data: { status: boolean, message: string, captchaProof?: string }) => {
    verifiedData.value = data
}

const needCaptcha = () => defaultStore.configs.user_captcha === '1'
const captchaPassed = () => !needCaptcha() || !!verifiedData.value?.captchaProof
const clearCaptcha = () => {
    verifiedData.value = null
    captchaRef.value?.reset()
}
watch([show, () => authStore.isShow], () => {
    verifiedData.value = null
})
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
    window.removeEventListener('message', handleOAuthMessage)
})

const oauthEnabled = () => defaultStore.configs.linux_do_oauth2 === '1'
    || defaultStore.configs.nodeloc_oauth2 === '1'
    || defaultStore.configs.google_oauth2 === '1'
    || defaultStore.configs.github_oauth2 === '1'
    || defaultStore.configs.rainbow_oauth2 === '1'
const rainbowTypes = () => String(defaultStore.configs.rainbow_oauth2_type || '').split(',').map(item => item.trim()).filter(Boolean)
const oauthOrigin = () => new URL(getApiBaseUrl() || window.location.origin, window.location.origin).origin
const oauthLoginUrl = (path: string) => `${getApiBaseUrl()}${path}`
const OAUTH_RESULT_KEY = 'moments_oauth_result'
const OAUTH_RETURN_PATH_KEY = 'moments_oauth_return_path'
const OAUTH_BIND_CURRENT_KEY = 'moments_oauth_bind_current'
const rainbowIconMap: Record<string, string> = {
    qq: '/img/qq.svg',
    wx: '/img/wx.svg',
    alipay: '/img/alipay.svg',
}
const rainbowIconSrc = (type: string) => rainbowIconMap[type.toLowerCase()] || ''

const restoreTokenPairFromStorage = () => {
    if (userStore.accessToken) return
    try {
        const raw = localStorage.getItem('user')
        if (!raw) return
        const persisted = JSON.parse(raw)
        const accessToken = persisted?.accessToken
        const refreshToken = persisted?.refreshToken
        if (accessToken && refreshToken) {
            userStore.setTokenPair({ accessToken, refreshToken })
        }
    } catch (error) {
        console.error('恢复登录状态失败:', error)
    }
}

const handleOAuthPayload = async (payload: OAuthCallbackPayload) => {
    restoreTokenPairFromStorage()
    if (payload.accessToken && payload.refreshToken) {
        userStore.setTokenPair({
            accessToken: payload.accessToken,
            refreshToken: payload.refreshToken,
            expiresIn: payload.expiresIn,
        })
        await userStore.fetchUserProfile()
        messageStore.show('三方登录成功', 'success', 2000)
        authStore.closeAuth()
        router.push('/')
        return
    }

    if (payload.needBind && payload.oauthTicket) {
        oauthTicket.value = payload.oauthTicket
        oauthProfile.value = payload.profile || null
        const shouldBindCurrentUser = sessionStorage.getItem(OAUTH_BIND_CURRENT_KEY) === '1'
        if (shouldBindCurrentUser && userStore.accessToken) {
            show.value = 'showOauthConfirm'
            authStore.showAuth()
            return
        }
        if (userStore.accessToken) {
            show.value = 'showOauthConfirm'
            authStore.showAuth()
            return
        }
        oauthRegisterInput.value.username = payload.profile?.nickname || ''
        oauthRegisterInput.value.email = payload.profile?.email || ''
        show.value = 'showOauthBind'
        messageStore.show('请绑定或创建站内账号', 'info', 2400)
    }
}

function handleOAuthMessage(event: MessageEvent) {
    if (event.origin !== oauthOrigin()) return
    const data = event.data
    if (!data || data.type !== 'moments-oauth-result') return
    handleOAuthPayload(data.payload)
}

function consumeStoredOAuthResult() {
    const raw = sessionStorage.getItem(OAUTH_RESULT_KEY)
    if (!raw) return
    sessionStorage.removeItem(OAUTH_RESULT_KEY)
    try {
        authStore.showAuth()
        handleOAuthPayload(JSON.parse(raw))
    } catch (error) {
        messageStore.show('三方登录结果解析失败，请重试', 'error', 2400)
    }
}

const oauthProviderLabel = (provider?: string | null, providerType?: string | null) => {
    if (provider === 'linux_do') return 'Linux.Do'
    if (provider === 'nodeloc') return 'NodeLoc'
    if (provider === 'google') return 'Google'
    if (provider === 'github') return 'GitHub'
    if (provider === 'rainbow') return (providerType || '彩虹').toUpperCase()
    return provider || '三方账号'
}

const oauthLoginPath = (provider: OAuthProvider, type?: string) => {
    if (provider === 'linux_do') return '/auth/oauth/linux-do/login?redirect=1'
    if (provider === 'nodeloc') return '/auth/oauth/nodeloc/login?redirect=1'
    if (provider === 'google') return '/auth/oauth/google/login?redirect=1'
    if (provider === 'github') return '/auth/oauth/github/login?redirect=1'
    return `/auth/oauth/rainbow/${encodeURIComponent(type || '')}/login?redirect=1`
}

const startOAuthLogin = (provider: OAuthProvider, type?: string) => {
    sessionStorage.setItem(OAUTH_RETURN_PATH_KEY, `${window.location.pathname}${window.location.search}${window.location.hash}` || '/')
    window.location.href = oauthLoginUrl(oauthLoginPath(provider, type))
}

const bindOAuthToCurrentUser = async () => {
    if (!oauthTicket.value) {
        messageStore.show('绑定凭证已失效，请重新授权', 'info', 2200)
        return
    }
    if (!userStore.accessToken) {
        messageStore.show('请先登录站内账号，再绑定三方身份', 'info', 2600)
        show.value = 'showLogin'
        return
    }

    const id = messageStore.show('正在绑定账号', 'loading')
    try {
        await bindOAuthAccount(oauthTicket.value)
        messageStore.update(id, { type: 'success', text: '绑定成功', duration: 2000 })
        sessionStorage.removeItem(OAUTH_BIND_CURRENT_KEY)
        oauthTicket.value = ''
        oauthProfile.value = null
        authStore.closeAuth()
    } catch (error: any) {
        messageStore.update(id, { type: 'error', text: error?.response?.data?.error || '绑定失败', duration: 2200 })
    }
}

const cancelOAuthBind = () => {
    sessionStorage.removeItem(OAUTH_BIND_CURRENT_KEY)
    oauthTicket.value = ''
    oauthProfile.value = null
    show.value = 'showLogin'
    authStore.closeAuth()
}

const confirmOAuthBind = async () => {
    await bindOAuthToCurrentUser()
    window.dispatchEvent(new CustomEvent('moments-oauth-bound'))
}

const handleOAuthRegisterBind = async () => {
    oauthRegisterInput.value.status = userStatus.value
    if (!oauthTicket.value) {
        messageStore.show('绑定凭证已失效，请重新授权', 'info', 2200)
        return
    }
    if ((!oauthRegisterInput.value.username && !oauthRegisterInput.value.email) || !oauthRegisterInput.value.password) {
        messageStore.show('用户名和邮箱至少填写一项，并设置密码', 'info', 2200)
        return
    }
    if (oauthRegisterInput.value.username && oauthRegisterInput.value.username.length < 3) {
        messageStore.show('用户名至少 3 位', 'info', 2200)
        return
    }
    if (oauthRegisterInput.value.password.length < 6) {
        messageStore.show('密码至少 6 位', 'info', 2200)
        return
    }
    if (oauthRegisterInput.value.email && !isValidEmail(oauthRegisterInput.value.email)) {
        messageStore.show('邮箱格式不正确', 'info', 2200)
        return
    }
    if (needRegisterEmailVerify() && (!isValidEmail(oauthRegisterInput.value.email) || !oauthRegisterInput.value.code)) {
        messageStore.show('请输入邮箱和验证码', 'info', 2000)
        return
    }
    if (!captchaPassed()) {
        messageStore.show('请先完成验证', 'info', 2000)
        return
    }

    const id = messageStore.show('正在创建并绑定', 'loading')
    try {
        const response = await registerAndBindOAuth({
            ...oauthRegisterInput.value,
            oauthTicket: oauthTicket.value,
            captchaProof: verifiedData.value?.captchaProof,
        })
        clearCaptcha()
        if (response.data?.accessToken && response.data?.refreshToken) {
            userStore.setTokenPair(response.data)
            await userStore.fetchUserProfile()
            messageStore.update(id, { type: 'success', text: '注册并登录成功', duration: 2000 })
            authStore.closeAuth()
            router.push('/')
        } else {
            messageStore.update(id, { type: 'success', text: response.data?.message || '注册绑定成功', duration: 2400 })
            show.value = 'showLogin'
        }
    } catch (error: any) {
        clearCaptcha()
        messageStore.update(id, { type: 'error', text: error?.response?.data?.error || '注册绑定失败', duration: 2200 })
    }
}

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
            const res = await userStore.handleEmailLogin({
                ...emailLoginInput.value,
                captchaProof: verifiedData.value?.captchaProof,
            })
            clearCaptcha()
            if (res.status === 0) {
                messageStore.update(id, { type: 'success', text: '登陆成功', duration: 2000 })
                if (oauthTicket.value) {
                    await bindOAuthToCurrentUser()
                } else {
                    authStore.closeAuth()
                    router.push('/')
                }
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
        const res = await userStore.handleLogin({
            ...userLoginInput.value,
            captchaProof: verifiedData.value?.captchaProof,
        })
        clearCaptcha()
        // 如果请求成功
        if (res.status === 0) {
            messageStore.update(id, { type: 'success', text: '登陆成功', duration: 2000 })
            if (oauthTicket.value) {
                await bindOAuthToCurrentUser()
            } else {
                authStore.closeAuth()
                router.push('/')
            }
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
    if (userRegisterInput.value.email && !isValidEmail(userRegisterInput.value.email)) {
        messageStore.show('邮箱格式不正确', 'info', 2000)
        return
    }
    if (needRegisterEmailVerify() && (!isValidEmail(userRegisterInput.value.email) || !userRegisterInput.value.code)) {
        messageStore.show('请输入邮箱和验证码', 'info', 2000)
        return
    }

    let id = messageStore.show('正在注册中', 'loading')
    try {
        // 用注册函数等待结果
        const response = await register({
            ...userRegisterInput.value,
            captchaProof: verifiedData.value?.captchaProof,
        })
        clearCaptcha()
        // 判断是否成功
        if (response) {
            messageStore.update(id, { type: 'success', text: '注册成功', duration: 2000 })
            show.value = 'showLogin'
        } else {
            messageStore.update(id, { type: 'error', text: '注册失败', duration: 2000 })
        }
    } catch (error: any) {
        clearCaptcha()
        console.error('注册过程中发生错误:', error);
        messageStore.update(id, { type: 'error', text: `${error?.response?.data?.error || '注册失败'}`, duration: 2000 });
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
                    <input :type="showLoginPassword ? 'text' : 'password'" id="password" v-model="userLoginInput.password" placeholder="密码"
                        @keyup.enter="handleLogin">
                    <button
                        type="button"
                        class="password-toggle"
                        :aria-label="showLoginPassword ? '隐藏密码' : '显示密码'"
                        @click="showLoginPassword = !showLoginPassword"
                    >
                        <Icon class="toggle-icon">
                            <EyeSlashRegular v-if="showLoginPassword" />
                            <EyeRegular v-else />
                        </Icon>
                    </button>
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
            <div class="captcha-wrap" v-if="defaultStore.configs.user_captcha === '1'">
                <Captcha ref="captchaRef" @verified="onCaptchaVerified" />
            </div>
            <div class="button">
                <button @click="handleLogin">登 录</button>
            </div>
            <div class="oauth-panel" v-if="oauthEnabled()">
                <div class="oauth-title"><span>快捷登录</span></div>
                <div class="oauth-icons">
                    <button
                        v-if="defaultStore.configs.linux_do_oauth2 === '1'"
                        class="oauth-icon linux-do"
                        title="Linux.Do 快捷登录"
                        aria-label="Linux.Do 快捷登录"
                        @click="startOAuthLogin('linux_do')"
                    >
                        <img src="/img/linux_do.png" alt="">
                    </button>
                    <button
                        v-if="defaultStore.configs.nodeloc_oauth2 === '1'"
                        class="oauth-icon nodeloc"
                        title="NodeLoc 快捷登录"
                        aria-label="NodeLoc 快捷登录"
                        @click="startOAuthLogin('nodeloc')"
                    >
                        <img src="/img/nodeloc.png" alt="">
                    </button>
                    <button
                        v-if="defaultStore.configs.google_oauth2 === '1'"
                        class="oauth-icon google"
                        title="Google 快捷登录"
                        aria-label="Google 快捷登录"
                        @click="startOAuthLogin('google')"
                    >
                        <img src="/img/google.svg" alt="">
                    </button>
                    <button
                        v-if="defaultStore.configs.github_oauth2 === '1'"
                        class="oauth-icon github"
                        title="GitHub 快捷登录"
                        aria-label="GitHub 快捷登录"
                        @click="startOAuthLogin('github')"
                    >
                        <img src="/img/github.svg" alt="">
                    </button>
                    <template v-if="defaultStore.configs.rainbow_oauth2 === '1'">
                        <button
                            v-for="type in rainbowTypes()"
                            :key="type"
                            class="oauth-icon rainbow"
                            :title="`${type.toUpperCase()} 快捷登录`"
                            :aria-label="`${type.toUpperCase()} 快捷登录`"
                            @click="startOAuthLogin('rainbow', type)"
                        >
                            <img v-if="rainbowIconSrc(type)" :src="rainbowIconSrc(type)" alt="">
                            <span v-else>{{ type.slice(0, 1).toUpperCase() }}</span>
                        </button>
                    </template>
                </div>
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
                    <input :type="showRegisterPassword ? 'text' : 'password'" id="registerPassword" v-model="userRegisterInput.password" placeholder="密码"
                        @keyup.enter="handleRegister">
                    <button
                        type="button"
                        class="password-toggle"
                        :aria-label="showRegisterPassword ? '隐藏密码' : '显示密码'"
                        @click="showRegisterPassword = !showRegisterPassword"
                    >
                        <Icon class="toggle-icon">
                            <EyeSlashRegular v-if="showRegisterPassword" />
                            <EyeRegular v-else />
                        </Icon>
                    </button>
                </div>
            </div>
            <div class="captcha-wrap" v-if="defaultStore.configs.user_captcha === '1'">
                <Captcha ref="captchaRef" @verified="onCaptchaVerified" />
            </div>
            <div class="button">
                <button @click="handleRegister">注 册</button>
            </div>
            <div class="footer">
                <span @click="show = 'showForgot'">忘记密码</span> | <span
                    @click="show = 'showLogin'">登录账号</span>
            </div>
        </div>

        <!-- OAuth 当前账号确认绑定 -->
        <div class="container" v-if="show === 'showOauthConfirm'">
            <div class="header">
                <div>
                    <p class="eyebrow">CONFIRM CONNECT</p>
                    <h2>确认绑定</h2>
                    <span class="subtitle">请确认要把这个三方账号绑定到当前站内账号</span>
                </div>
                <button class="close-button" aria-label="取消绑定" @click="cancelOAuthBind">
                    <Icon class="icon">
                        <Times class="close" />
                    </Icon>
                </button>
            </div>
            <div class="oauth-profile" v-if="oauthProfile">
                <img v-if="oauthProfile.avatar" :src="oauthProfile.avatar" alt="OAuth 头像">
                <div>
                    <strong>{{ oauthProfile.nickname || '三方账号' }}</strong>
                    <span>{{ oauthProviderLabel(oauthProfile.provider, oauthProfile.providerType) }}</span>
                </div>
            </div>
            <div class="oauth-confirm-card">
                <span>将绑定到当前账号</span>
                <strong>{{ userStore.profile?.nickname || userStore.profile?.username || '当前账号' }}</strong>
            </div>
            <div class="oauth-confirm-actions">
                <button class="cancel-bind" @click="cancelOAuthBind">取消</button>
                <button class="confirm-bind" @click="confirmOAuthBind">确认绑定</button>
            </div>
        </div>

        <!-- OAuth 首次绑定 -->
        <div class="container" v-if="show === 'showOauthBind'">
            <div class="header">
                <div>
                    <p class="eyebrow">OAUTH CONNECT</p>
                    <h2>关联站内账号</h2>
                    <span class="subtitle">首次使用三方登录，需要选择一个站内账号承接身份</span>
                </div>
                <button class="close-button" aria-label="关闭绑定窗口" @click="authStore.closeAuth">
                    <Icon class="icon">
                        <Times class="close" />
                    </Icon>
                </button>
            </div>
            <div class="oauth-profile" v-if="oauthProfile">
                <img v-if="oauthProfile.avatar" :src="oauthProfile.avatar" alt="OAuth 头像">
                <div>
                    <strong>{{ oauthProfile.nickname || '三方账号' }}</strong>
                    <span>{{ oauthProviderLabel(oauthProfile.provider, oauthProfile.providerType) }}</span>
                </div>
            </div>
            <div class="bind-actions">
                <button class="bind-current" @click="bindOAuthToCurrentUser">
                    {{ userStore.accessToken ? '绑定当前已登录账号' : '登录已有账号后绑定' }}
                </button>
            </div>
            <div class="divider"><span>或创建新账号并绑定</span></div>
            <div class="body">
                <div class="identifier">
                    <label for="oauthRegisterUsername">
                        <Icon class="icon"><UserRegular /></Icon>
                        账号：
                    </label>
                    <input type="text" id="oauthRegisterUsername" v-model="oauthRegisterInput.username" placeholder="用户名，可留空用邮箱生成"
                        @keyup.enter="handleOAuthRegisterBind">
                </div>
                <div class="identifier">
                    <label for="oauthRegisterEmail">
                        <Icon class="icon"><EnvelopeRegular /></Icon>
                        邮箱：
                    </label>
                    <input type="email" id="oauthRegisterEmail" v-model="oauthRegisterInput.email" placeholder="邮箱，可留空仅用用户名"
                        @keyup.enter="handleOAuthRegisterBind">
                </div>
                <div class="identifier code-row" v-if="needRegisterEmailVerify()">
                    <label for="oauthRegisterCode">
                        <Icon class="icon"><ShieldAlt /></Icon>
                        验证码：
                    </label>
                    <input type="text" id="oauthRegisterCode" v-model="oauthRegisterInput.code" placeholder="验证码"
                        @keyup.enter="handleOAuthRegisterBind">
                    <button class="code-button" :disabled="sendCodeLoading || codeCooldown > 0" @click="sendCode(oauthRegisterInput.email)">
                        {{ codeCooldown > 0 ? `${codeCooldown}s` : '发送' }}
                    </button>
                </div>
                <div class="password">
                    <label for="oauthRegisterPassword">
                        <Icon class="icon"><Fingerprint /></Icon>
                        密码：
                    </label>
                    <input :type="showRegisterPassword ? 'text' : 'password'" id="oauthRegisterPassword" v-model="oauthRegisterInput.password" placeholder="密码"
                        @keyup.enter="handleOAuthRegisterBind">
                    <button type="button" class="password-toggle" @click="showRegisterPassword = !showRegisterPassword">
                        <Icon class="toggle-icon">
                            <EyeSlashRegular v-if="showRegisterPassword" />
                            <EyeRegular v-else />
                        </Icon>
                    </button>
                </div>
                <div class="captcha-wrap" v-if="defaultStore.configs.user_captcha === '1'">
                    <Captcha ref="captchaRef" @verified="onCaptchaVerified" />
                </div>
            </div>
            <div class="button">
                <button @click="handleOAuthRegisterBind">创建并绑定</button>
            </div>
            <div class="footer">
                <span @click="show = 'showLogin'">已有账号？先登录</span> | <span @click="startOAuthLogin((oauthProfile?.provider || 'linux_do') as OAuthProvider, oauthProfile?.providerType || undefined)">重新授权</span>
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
                    <input :type="showResetPassword ? 'text' : 'password'" id="resetPassword" v-model="resetPasswordInput.password" placeholder="新密码"
                        @keyup.enter="handleResetPassword">
                    <button
                        type="button"
                        class="password-toggle"
                        :aria-label="showResetPassword ? '隐藏密码' : '显示密码'"
                        @click="showResetPassword = !showResetPassword"
                    >
                        <Icon class="toggle-icon">
                            <EyeSlashRegular v-if="showResetPassword" />
                            <EyeRegular v-else />
                        </Icon>
                    </button>
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

.oauth-panel {
    position: relative;
    z-index: 1;
    margin-top: 14px;
}

.oauth-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #888;
    font-size: 12px;
    font-weight: 700;
}

.oauth-title::before,
.oauth-title::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--color-border);
}

.oauth-icons {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 12px;
}

.oauth-icon {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    display: grid;
    place-items: center;
    padding: 0;
    background: transparent;
    color: #586C97;
    font-size: 15px;
    font-weight: 900;
    letter-spacing: -0.02em;
}

.oauth-icon img {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
}

.oauth-icon:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.04);
}

.bind-current {
    min-height: 38px;
    border-radius: 12px;
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    box-shadow: 0 10px 18px rgba(108, 173, 241, 0.16);
}

.divider {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 12px 0 14px;
    color: #888;
    font-size: 12px;
    font-weight: 700;
}

.divider::before,
.divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: var(--color-border);
}

.oauth-profile {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 16px;
    background: color-mix(in srgb, var(--color-bg-app) 80%, var(--color-ad));
}

.oauth-profile img {
    width: 42px;
    height: 42px;
    border-radius: 8px;
    object-fit: cover;
}

.oauth-profile strong,
.oauth-profile span {
    display: block;
}

.oauth-profile strong {
    color: var(--color-text-primary);
    font-size: 15px;
}

.oauth-profile span {
    margin-top: 4px;
    color: #888;
    font-size: 12px;
}

.bind-actions {
    position: relative;
    z-index: 1;
}

.bind-current {
    width: 100%;
    background: linear-gradient(135deg, #6cadf1, #16c36a);
}

.oauth-confirm-card {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 12px;
    padding: 12px;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    background: color-mix(in srgb, var(--color-bg-app) 82%, var(--color-ad));
    font-size: 13px;
}

.oauth-confirm-card span {
    color: #888;
}

.oauth-confirm-card strong {
    color: #586C97;
}

.oauth-confirm-actions {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 16px;
}

.oauth-confirm-actions button {
    min-height: 42px;
    margin: 0;
    border-radius: 14px;
    color: #fff;
    font-size: 14px;
    font-weight: 800;
}

.cancel-bind {
    background: #888;
}

.confirm-bind {
    background: linear-gradient(135deg, #16c36a, #53b16a);
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

.password-toggle {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    margin-left: 8px;
    padding: 0;
    border-radius: 50%;
    background: var(--color-ad);
    color: #586C97;
}

.password-toggle .toggle-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin: 0;
    line-height: 1;
}

.password-toggle .toggle-icon :deep(svg) {
    display: block;
}

.password-toggle:hover:not(:disabled) {
    color: #fff;
    background: #6cadf1;
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