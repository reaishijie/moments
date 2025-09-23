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
    // console.log('@', res);
    appkey.value = res.data.verify_hcaptcha_app
  } catch (error) {
    // console.log('@', error);
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
  <div class="hcaptcha-container">
    <vue-hcaptcha v-if="appkey" :sitekey="appkey" @verify="onCaptchaVerified"></vue-hcaptcha>
    <span v-else>正在加载验证码</span>
  </div>
</template>

<style scoped>
/**

.hcaptcha-container {
  padding: 1rem;
  max-width: 100%;
  border: 1px solid #ccc;
  border-radius: 8px;
  text-align: center;
}

*/

</style>