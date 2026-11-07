import { ref } from 'vue'
import type { Ref } from 'vue'
import { register, resetPassword } from '@/api/auth'
import router from '@/router'
import { useAuthStore } from '@/store/auth'
import { useMessageStore } from '@/store/message'
import { useUserStore } from '@/store/user'
import type { emailLoginData, loginData, registerData, resetPasswordData } from '@/types/user'
import { isValidEmail } from '@/utils/validation'
import type { AuthScreen, useOAuthAuth } from './useOAuthAuth'
import type { useAuthCaptcha } from './useAuthCaptcha'

export interface UseAuthFormsOptions {
  show: Ref<AuthScreen>
  userStatus: Ref<number>
  captcha: ReturnType<typeof useAuthCaptcha>
  oauth: ReturnType<typeof useOAuthAuth>
  isRegisterEmailVerifyEnabled: () => boolean
}

/**
 * 账号密码登录、邮箱验证码登录、注册、重置密码四类表单。
 *
 * 从 Auth.vue 抽出，只保留纯表单状态与提交逻辑，界面状态由调用方持有。
 */
export function useAuthForms(options: UseAuthFormsOptions) {
  const authStore = useAuthStore()
  const messageStore = useMessageStore()
  const userStore = useUserStore()

  const loginMode = ref<'password' | 'email'>('password')
  const showLoginPassword = ref(false)
  const showRegisterPassword = ref(false)
  const showResetPassword = ref(false)

  const userLoginInput = ref<loginData>({ identifier: '', password: '' })
  const emailLoginInput = ref<emailLoginData>({ email: '', code: '' })
  const userRegisterInput = ref<registerData>({
    username: '',
    password: '',
    email: '',
    code: '',
    status: options.userStatus.value,
  })
  const resetPasswordInput = ref<resetPasswordData>({ email: '', code: '', password: '' })

  /** 登录成功后的统一收尾：需要时继续绑定三方账号，否则关闭弹窗回首页 */
  const finishLogin = async () => {
    if (options.oauth.oauthTicket.value) {
      await options.oauth.bindOAuthToCurrentUser()
      return
    }
    authStore.closeAuth()
    router.push('/')
  }

  const handleLogin = async () => {
    if (!options.captcha.captchaPassed()) {
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
          captchaProof: options.captcha.verifiedData.value?.captchaProof,
        })
        options.captcha.clearCaptcha()
        if (res.status === 0) {
          messageStore.update(id, { type: 'success', text: '登陆成功', duration: 2000 })
          await finishLogin()
        } else {
          messageStore.update(id, { type: 'error', text: `${res.error.response.data.error}`, duration: 2000 })
        }
      } catch (error) {
        console.error(error)
        messageStore.update(id, { type: 'error', text: '网络异常', duration: 2000 })
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

    const id = messageStore.show('正在登录中', 'loading')
    try {
      const res = await userStore.handleLogin({
        ...userLoginInput.value,
        captchaProof: options.captcha.verifiedData.value?.captchaProof,
      })
      options.captcha.clearCaptcha()
      if (res.status === 0) {
        messageStore.update(id, { type: 'success', text: '登陆成功', duration: 2000 })
        await finishLogin()
      } else {
        messageStore.update(id, { type: 'error', text: `${res.error.response.data.error}`, duration: 2000 })
      }
    } catch (error) {
      console.error(error)
      messageStore.update(id, { type: 'error', text: '网络异常', duration: 2000 })
    }
  }

  const handleRegister = async () => {
    userRegisterInput.value.status = options.userStatus.value
    if (!options.captcha.captchaPassed()) {
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
    if (options.isRegisterEmailVerifyEnabled() && (!isValidEmail(userRegisterInput.value.email) || !userRegisterInput.value.code)) {
      messageStore.show('请输入邮箱和验证码', 'info', 2000)
      return
    }

    const id = messageStore.show('正在注册中', 'loading')
    try {
      const response = await register({
        ...userRegisterInput.value,
        captchaProof: options.captcha.verifiedData.value?.captchaProof,
      })
      options.captcha.clearCaptcha()
      if (response) {
        messageStore.update(id, { type: 'success', text: '注册成功', duration: 2000 })
        options.show.value = 'showLogin'
      } else {
        messageStore.update(id, { type: 'error', text: '注册失败', duration: 2000 })
      }
    } catch (error: any) {
      options.captcha.clearCaptcha()
      console.error('注册过程中发生错误:', error)
      messageStore.update(id, { type: 'error', text: `${error?.response?.data?.error || '注册失败'}`, duration: 2000 })
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
      options.show.value = 'showLogin'
      loginMode.value = 'password'
    } catch (error: any) {
      messageStore.update(id, { type: 'error', text: error?.response?.data?.error || '重置失败', duration: 2000 })
    }
  }

  return {
    loginMode,
    showLoginPassword,
    showRegisterPassword,
    showResetPassword,
    userLoginInput,
    emailLoginInput,
    userRegisterInput,
    resetPasswordInput,
    handleLogin,
    handleRegister,
    handleResetPassword,
  }
}
