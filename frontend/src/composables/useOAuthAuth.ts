import { ref } from 'vue'
import type { Ref } from 'vue'
import {
  bindOAuthAccount,
  getApiBaseUrl,
  registerAndBindOAuth,
  type OAuthCallbackPayload,
  type OAuthProfile,
  type OAuthProvider,
} from '@/api/auth'
import router from '@/router'
import { useAuthStore } from '@/store/auth'
import { useDefaultStore } from '@/store/default'
import { useMessageStore } from '@/store/message'
import { useUserStore } from '@/store/user'
import type { registerData } from '@/types/user'
import { isValidEmail } from '@/utils/validation'
import type { useAuthCaptcha } from './useAuthCaptcha'

/** 登录弹窗的五个界面状态 */
export type AuthScreen = 'showLogin' | 'showRegister' | 'showForgot' | 'showOauthBind' | 'showOauthConfirm'

const OAUTH_RESULT_KEY = 'moments_oauth_result'
const OAUTH_RETURN_PATH_KEY = 'moments_oauth_return_path'
const OAUTH_BIND_CURRENT_KEY = 'moments_oauth_bind_current'

const rainbowIconMap: Record<string, string> = {
  qq: '/img/qq.svg',
  wx: '/img/wx.svg',
  alipay: '/img/alipay.svg',
}

export interface UseOAuthAuthOptions {
  show: Ref<AuthScreen>
  userStatus: Ref<number>
  captcha: ReturnType<typeof useAuthCaptcha>
  isRegisterEmailVerifyEnabled: () => boolean
}

/**
 * 三方登录（Linux.Do / NodeLoc / Google / GitHub / 彩虹聚合）的完整交互逻辑。
 *
 * 包含回跳结果消费、绑定已有账号、注册并绑定三条路径。
 */
export function useOAuthAuth(options: UseOAuthAuthOptions) {
  const authStore = useAuthStore()
  const messageStore = useMessageStore()
  const userStore = useUserStore()
  const defaultStore = useDefaultStore()

  const oauthTicket = ref('')
  const oauthProfile = ref<OAuthProfile | null>(null)
  const oauthRegisterInput = ref<registerData>({
    username: '',
    password: '',
    email: '',
    code: '',
    status: options.userStatus.value,
  })

  const oauthEnabled = () => defaultStore.configs.linux_do_oauth2 === '1'
    || defaultStore.configs.nodeloc_oauth2 === '1'
    || defaultStore.configs.google_oauth2 === '1'
    || defaultStore.configs.github_oauth2 === '1'
    || defaultStore.configs.rainbow_oauth2 === '1'

  const rainbowTypes = () => String(defaultStore.configs.rainbow_oauth2_type || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  const oauthOrigin = () => new URL(getApiBaseUrl() || window.location.origin, window.location.origin).origin
  const oauthLoginUrl = (path: string) => `${getApiBaseUrl()}${path}`
  const rainbowIconSrc = (type: string) => rainbowIconMap[type.toLowerCase()] || ''

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
    sessionStorage.setItem(
      OAUTH_RETURN_PATH_KEY,
      `${window.location.pathname}${window.location.search}${window.location.hash}` || '/',
    )
    window.location.href = oauthLoginUrl(oauthLoginPath(provider, type))
  }

  const bindOAuthToCurrentUser = async () => {
    if (!oauthTicket.value) {
      messageStore.show('绑定凭证已失效，请重新授权', 'info', 2200)
      return
    }
    if (!userStore.accessToken) {
      messageStore.show('请先登录站内账号，再绑定三方身份', 'info', 2600)
      options.show.value = 'showLogin'
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
    options.show.value = 'showLogin'
    authStore.closeAuth()
  }

  const confirmOAuthBind = async () => {
    await bindOAuthToCurrentUser()
    window.dispatchEvent(new CustomEvent('moments-oauth-bound'))
  }

  const handleOAuthRegisterBind = async () => {
    oauthRegisterInput.value.status = options.userStatus.value
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
    if (options.isRegisterEmailVerifyEnabled() && (!isValidEmail(oauthRegisterInput.value.email) || !oauthRegisterInput.value.code)) {
      messageStore.show('请输入邮箱和验证码', 'info', 2000)
      return
    }
    if (!options.captcha.captchaPassed()) {
      messageStore.show('请先完成验证', 'info', 2000)
      return
    }

    const id = messageStore.show('正在创建并绑定', 'loading')
    try {
      const response = await registerAndBindOAuth({
        ...oauthRegisterInput.value,
        oauthTicket: oauthTicket.value,
        captchaProof: options.captcha.verifiedData.value?.captchaProof,
      })
      options.captcha.clearCaptcha()
      if (response.data?.accessToken) {
        userStore.setAccessToken(response.data)
        await userStore.fetchUserProfile()
        messageStore.update(id, { type: 'success', text: '注册并登录成功', duration: 2000 })
        authStore.closeAuth()
        router.push('/')
      } else {
        messageStore.update(id, { type: 'success', text: response.data?.message || '注册绑定成功', duration: 2400 })
        options.show.value = 'showLogin'
      }
    } catch (error: any) {
      options.captcha.clearCaptcha()
      messageStore.update(id, { type: 'error', text: error?.response?.data?.error || '注册绑定失败', duration: 2200 })
    }
  }

  const handleOAuthPayload = async (payload: OAuthCallbackPayload) => {
    if (payload.authenticated) {
      await userStore.restoreSession(true)
      if (!userStore.accessToken) {
        messageStore.show('三方登录状态恢复失败，请重试', 'error', 2400)
        return
      }
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
        options.show.value = 'showOauthConfirm'
        authStore.showAuth()
        return
      }
      if (userStore.accessToken) {
        options.show.value = 'showOauthConfirm'
        authStore.showAuth()
        return
      }
      oauthRegisterInput.value.username = payload.profile?.nickname || ''
      oauthRegisterInput.value.email = payload.profile?.email || ''
      options.show.value = 'showOauthBind'
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

  return {
    oauthTicket,
    oauthProfile,
    oauthRegisterInput,
    oauthEnabled,
    rainbowTypes,
    rainbowIconSrc,
    oauthProviderLabel,
    startOAuthLogin,
    bindOAuthToCurrentUser,
    cancelOAuthBind,
    confirmOAuthBind,
    handleOAuthRegisterBind,
    handleOAuthMessage,
    consumeStoredOAuthResult,
  }
}
