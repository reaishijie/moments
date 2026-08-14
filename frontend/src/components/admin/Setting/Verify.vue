<script setup lang="ts" name="VerifySetting">
import ConfigForm from './ConfigForm.vue'
import type { ConfigFieldSchema } from './types'

const fields: ConfigFieldSchema[] = [
  { key: 'user_captcha', type: 'switch' as const, trueText: '已开启', falseText: '已关闭' },
  { key: 'user_captcha_article', type: 'switch' as const, trueText: '已开启', falseText: '已关闭' },
  { key: 'user_captcha_comment', type: 'switch' as const, trueText: '已开启', falseText: '已关闭' },
  { key: 'user_captcha_update', type: 'switch' as const, trueText: '已开启', falseText: '已关闭' },
  { key: 'user_email_verify_register', type: 'switch' as const, trueText: '已开启', falseText: '已关闭' },
  {
    key: 'captcha_provider',
    type: 'select' as const,
    options: [
      { label: 'hCaptcha', value: 'hcaptcha' },
      { label: 'Cloudflare Turnstile', value: 'turnstile' },
    ],
  },
  {
    key: 'verify_hcaptcha_app',
    placeholder: 'hCaptcha 客户端站点 Key',
    visibleWhen: configs => configs.captcha_provider !== 'turnstile',
  },
  {
    key: 'verify_hcaptcha_user',
    type: 'password' as const,
    placeholder: 'hCaptcha 服务端密钥',
    visibleWhen: configs => configs.captcha_provider !== 'turnstile',
  },
  {
    key: 'verify_turnstile_site_key',
    placeholder: 'Cloudflare Turnstile Site Key',
    visibleWhen: configs => configs.captcha_provider === 'turnstile',
  },
  {
    key: 'verify_turnstile_secret',
    type: 'password' as const,
    placeholder: 'Cloudflare Turnstile Secret Key',
    visibleWhen: configs => configs.captcha_provider === 'turnstile',
  },
]
</script>

<template>
  <ConfigForm
    title="验证设置"
    description="配置业务验证开关，并选择 hCaptcha 或 Cloudflare Turnstile。"
    category="verify"
    :fields="fields"
  />
</template>
