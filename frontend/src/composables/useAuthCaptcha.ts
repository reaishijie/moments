import { onUnmounted, ref } from 'vue'

import { sendEmailCode } from '@/api/auth'
import { useMessageStore } from '@/store/message'
import { isValidEmail } from '@/utils/validation'
import type Captcha from '@/components/captcha/Captcha.vue'

export interface CaptchaResult {
  status: boolean
  message: string
  captchaProof?: string
}

export interface UseAuthCaptchaOptions {
  /** 人机验证是否开启 */
  isCaptchaRequired: () => boolean
  /** 页面切换时清空已验证状态 */
  onReset?: () => void
}

/**
 * 登录/注册弹窗中的「人机验证 + 邮箱验证码」逻辑。
 *
 * 从 Auth.vue 抽出，避免验证状态、倒计时等胶水代码和表单提交混在一起。
 */
export function useAuthCaptcha(options: UseAuthCaptchaOptions) {
  const messageStore = useMessageStore()

  const verifiedData = ref<CaptchaResult | null>(null)
  const captchaRef = ref<InstanceType<typeof Captcha> | null>(null)
  const sendCodeLoading = ref(false)
  const codeCooldown = ref(0)
  let codeCooldownTimer: ReturnType<typeof setInterval> | null = null

  const onCaptchaVerified = (data: CaptchaResult) => {
    verifiedData.value = data
  }

  const needCaptcha = () => options.isCaptchaRequired()

  const captchaPassed = () => !needCaptcha() || !!verifiedData.value?.captchaProof

  const clearCaptcha = () => {
    verifiedData.value = null
    captchaRef.value?.reset()
  }

  const resetCaptchaState = () => {
    verifiedData.value = null
    options.onReset?.()
  }

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

  onUnmounted(() => {
    if (codeCooldownTimer) clearInterval(codeCooldownTimer)
  })

  return {
    verifiedData,
    captchaRef,
    onCaptchaVerified,
    needCaptcha,
    captchaPassed,
    clearCaptcha,
    resetCaptchaState,
    sendCodeLoading,
    codeCooldown,
    startCodeCooldown,
    sendCode,
  }
}
