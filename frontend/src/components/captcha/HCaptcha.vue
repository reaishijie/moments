<script setup lang="ts" name="HCaptcha">
import { ref, onMounted, onUnmounted } from 'vue'
import VueHcaptcha from '@hcaptcha/vue3-hcaptcha';
import { verifyHcaptcha } from '@/api/auth';
import { getPublicConfig } from '@/api/admin';
import { useMessageStore } from '@/store/message';

const messageStore = useMessageStore()
// 向父组件暴露事件
const emit = defineEmits<{
  (e: 'verified', res: {status: boolean, message: string}): void
}>()

// 定义存储的hcaptcha 的appkey
const appkey = ref()
// 从后端公共接口请求appkey并进行赋值
onMounted(async () => {
  try {
    const res = await getPublicConfig()
    appkey.value = res.data.verify_hcaptcha_app
  } catch (error) {
    console.log('验证失败', error);
    messageStore.show('获取密钥失败', 'error', 2000)
  }
})
onUnmounted(() => {
  messageStore.close(id)
})
// 用来存储验证后得到的 token
const captchaToken = ref<string | null>(null)
const id = messageStore.show('等待真人验证...', 'info')
const isLoading = ref<boolean>(false)

// 验证后回调函数
const onCaptchaVerified = (token: string) => {
  captchaToken.value = token
  messageStore.update(id, { text: '令牌已获取，可以验证了' })
  handleVerification()
}
// 处理验证
const handleVerification = async () => {
  if (!captchaToken.value) {
    messageStore.update(id, { text: '令牌缺失，请先完成验证！' })
    return
  }
  isLoading.value = true
  messageStore.update(id, { text: '正在向后端验证请求', type: 'loading' })

  try {
    const res = await verifyHcaptcha({ captchaToken: captchaToken.value })
    emit('verified', res.data)
    if (res.data.status) {
      captchaToken.value = null
      messageStore.update(id, { text: '验证成功', type: 'success', duration: 2000 })
    } else {
      captchaToken.value = null
      messageStore.update(id, { text: '验证失败', type: 'error', duration: 2000 })
    }
  } catch (error) {
    console.error('api调用失败，network/后端')
    messageStore.show('调用api失败', 'error', 2000)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="hcaptcha-container" :class="{ verifying: isLoading }">
    <div class="captcha-title">
      <span class="captcha-dot"></span>
      真人验证
    </div>
    <div class="captcha-widget">
      <vue-hcaptcha v-if="appkey" :sitekey="appkey" @verify="onCaptchaVerified"></vue-hcaptcha>
      <span v-else class="captcha-loading">正在加载验证码...</span>
    </div>
  </div>
</template>

<style scoped>
.hcaptcha-container {
  width: 100%;
  display: grid;
  gap: 10px;
}

.captcha-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #586C97;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.captcha-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6cadf1, #16c36a);
  box-shadow: 0 0 0 4px rgba(108, 173, 241, 0.14);
}

.captcha-widget {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 78px;
  overflow: hidden;
  border-radius: 12px;
}

.captcha-loading {
  width: 100%;
  min-height: 74px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background:
    linear-gradient(90deg, transparent, rgba(108, 173, 241, 0.12), transparent),
    var(--color-ad);
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