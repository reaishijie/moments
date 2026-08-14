<script setup lang="ts" name="Captcha">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha'
import { verifyCaptcha } from '@/api/auth'
import { useDefaultStore } from '@/store/default'
import { useMessageStore } from '@/store/message'

type CaptchaResult = { status: boolean, message: string, captchaProof?: string }

type TurnstileOptions = {
  sitekey: string
  size?: 'normal' | 'compact' | 'flexible'
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': () => void
}

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileOptions) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const emit = defineEmits<{
  (e: 'verified', res: CaptchaResult): void
}>()

const defaultStore = useDefaultStore()
const messageStore = useMessageStore()
const provider = computed(() => defaultStore.configs.captcha_provider === 'turnstile' ? 'turnstile' : 'hcaptcha')
const siteKey = computed(() => provider.value === 'turnstile'
  ? defaultStore.configs.verify_turnstile_site_key
  : defaultStore.configs.verify_hcaptcha_app)
const turnstileContainer = ref<HTMLElement | null>(null)
const hcaptchaWidget = ref<InstanceType<typeof VueHcaptcha> | null>(null)
const isLoading = ref(false)
const messageId = messageStore.show('等待真人验证...', 'info')
let turnstileWidgetId: string | null = null
let turnstileScriptPromise: Promise<void> | null = null

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()
  if (turnstileScriptPromise) return turnstileScriptPromise

  turnstileScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-moments-turnstile]')
    const script = existing || document.createElement('script')
    const handleLoad = () => window.turnstile ? resolve() : reject(new Error('Turnstile API 未加载'))
    const handleError = () => reject(new Error('Turnstile 脚本加载失败'))

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })
    if (!existing) {
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.momentsTurnstile = 'true'
      document.head.appendChild(script)
    }
  })

  return turnstileScriptPromise
}

function invalidateVerification(message = '验证已过期，请重新验证') {
  emit('verified', { status: false, message })
  messageStore.update(messageId, { text: message, type: 'info' })
}

async function handleToken(token: string) {
  isLoading.value = true
  messageStore.update(messageId, { text: '正在验证', type: 'loading' })

  try {
    const response = await verifyCaptcha({ captchaToken: token })
    emit('verified', response.data)
    messageStore.update(messageId, {
      text: response.data.status ? '验证成功' : '验证失败',
      type: response.data.status ? 'success' : 'error',
      duration: 2000,
    })
    if (!response.data.status) resetWidget()
  } catch (error) {
    emit('verified', { status: false, message: '验证失败' })
    messageStore.update(messageId, { text: '验证失败，请重试', type: 'error', duration: 2000 })
    resetWidget()
    console.error('人机验证请求失败', error)
  } finally {
    isLoading.value = false
  }
}

function resetWidget() {
  if (provider.value === 'turnstile' && turnstileWidgetId && window.turnstile) {
    window.turnstile.reset(turnstileWidgetId)
  } else {
    hcaptchaWidget.value?.reset()
  }
}

function resetCaptcha() {
  emit('verified', { status: false, message: '请完成人机验证' })
  resetWidget()
  messageStore.update(messageId, { text: '等待真人验证...', type: 'info' })
}

defineExpose({ reset: resetCaptcha })

function removeTurnstileWidget() {
  if (turnstileWidgetId && window.turnstile) {
    window.turnstile.remove(turnstileWidgetId)
  }
  turnstileWidgetId = null
}

async function renderTurnstile() {
  removeTurnstileWidget()
  if (provider.value !== 'turnstile' || !siteKey.value) return

  try {
    await loadTurnstileScript()
    await nextTick()
    if (!turnstileContainer.value || !window.turnstile || provider.value !== 'turnstile') return

    turnstileWidgetId = window.turnstile.render(turnstileContainer.value, {
      sitekey: siteKey.value,
      size: 'flexible',
      callback: handleToken,
      'expired-callback': () => invalidateVerification(),
      'error-callback': () => invalidateVerification('验证码加载失败，请重试'),
    })
  } catch (error) {
    invalidateVerification('验证码加载失败，请刷新重试')
    console.error('Cloudflare Turnstile 加载失败', error)
  }
}

onMounted(renderTurnstile)
watch([provider, siteKey], () => {
  emit('verified', { status: false, message: '请完成人机验证' })
  renderTurnstile()
})

onUnmounted(() => {
  removeTurnstileWidget()
  messageStore.close(messageId)
})
</script>

<template>
  <div class="captcha-container" :class="{ verifying: isLoading }">
    <div class="captcha-title">
      <span class="captcha-dot"></span>
      真人验证
    </div>
    <div class="captcha-widget">
      <VueHcaptcha
        v-if="provider === 'hcaptcha' && siteKey"
        ref="hcaptchaWidget"
        :sitekey="siteKey"
        @verify="handleToken"
        @expired="invalidateVerification()"
        @error="invalidateVerification('验证码加载失败，请重试')"
      />
      <div v-else-if="provider === 'turnstile' && siteKey" ref="turnstileContainer" class="turnstile-widget"></div>
      <span v-else class="captcha-loading">验证码未配置</span>
    </div>
  </div>
</template>

<style scoped>
.captcha-container {
  width: 100%;
  display: grid;
  gap: 10px;
}

.captcha-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #586c97;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
}

.captcha-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #16c36a;
  box-shadow: 0 0 0 4px rgba(108, 173, 241, 0.14);
}

.captcha-widget {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 78px;
  overflow: hidden;
}

.turnstile-widget {
  width: 100%;
  min-width: 0;
}

.captcha-loading {
  width: 100%;
  min-height: 74px;
  display: grid;
  place-items: center;
  background: var(--color-ad);
  color: #888;
  font-size: 12px;
}

.verifying {
  opacity: 0.72;
  pointer-events: none;
}

@media (max-width: 360px) {
  .captcha-widget {
    transform: scale(0.92);
    transform-origin: center;
    min-height: 72px;
  }
}
</style>
