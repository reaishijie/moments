<script setup lang="ts" name="ASUser">
import ConfigForm from './ConfigForm.vue'
import type { ConfigFieldSchema } from './types'

const fields: ConfigFieldSchema[] = [
  { key: 'user_status', type: 'switch' as const, trueText: '系统开放', falseText: '系统关闭' },
  { key: 'user_auth', type: 'switch' as const, trueText: '需要审核', falseText: '无需审核' },
]
</script>

<template>
  <ConfigForm
    title="用户与验证"
    description="用户开放状态与注册审核策略。验证码和 hCaptcha 密钥请在验证设置中维护。"
    category="user"
    :fields="fields"
  />
</template>
