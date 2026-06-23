<script setup lang="ts" name="Email">
import ConfigForm from './ConfigForm.vue'
import type { ConfigFieldSchema } from './types'

const fields: ConfigFieldSchema[] = [
  { key: 'mail_host', placeholder: '示例：smtp.qq.com' },
  { key: 'mail_port', placeholder: '服务端口，如 465、25' },
  { key: 'mail_secure', type: 'switch' as const, trueValue: 'true', falseValue: 'false', trueText: '开启加密', falseText: '关闭加密' },
  { key: 'mail_user', placeholder: '发件邮箱账号' },
  { key: 'mail_pass', type: 'password' as const, placeholder: 'SMTP 授权码或密码' },
]
</script>

<template>
  <ConfigForm
    title="邮箱配置"
    description="发件邮箱 SMTP 服务配置，用于验证邮件和站点通知。"
    category="email"
    :fields="fields"
  />
</template>
