<script setup lang="ts" name="VerifySetting">
import ConfigForm from './ConfigForm.vue'
import type { ConfigFieldSchema } from './types'

const fields: ConfigFieldSchema[] = [
  { key: 'user_captcha', type: 'switch' as const, trueText: '已开启', falseText: '已关闭' },
  { key: 'user_captcha_article', type: 'switch' as const, trueText: '已开启', falseText: '已关闭' },
  { key: 'user_captcha_comment', type: 'switch' as const, trueText: '已开启', falseText: '已关闭' },
  { key: 'user_captcha_update', type: 'switch' as const, trueText: '已开启', falseText: '已关闭' },
  { key: 'verify_hcaptcha_app', placeholder: 'hCaptcha 客户端站点 Key' },
  { key: 'verify_hcaptcha_user', type: 'password' as const, placeholder: 'hCaptcha 服务端密钥' },
]
</script>

<template>
  <ConfigForm
    title="验证设置"
    description="登录注册、发文、评论和资料更新验证码开关，以及 hCaptcha 密钥配置。"
    category="verify"
    :fields="fields"
  />
</template>
