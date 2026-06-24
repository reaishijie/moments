<script setup lang="ts" name="OtherSetting">
import ConfigForm from './ConfigForm.vue'
import type { ConfigFieldSchema } from './types'

const locationFields: ConfigFieldSchema[] = [
  {
    key: 'location_method',
    type: 'select' as const,
    options: [
      { label: 'ping0 位置服务', value: '0' },
    ],
  },
]

const linkFields: ConfigFieldSchema[] = [
  { key: 'link_brief', type: 'textarea' as const, placeholder: '友情链接页面顶部描述' },
]
</script>

<template>
  <div class="other-setting">
    <ConfigForm
      title="位置服务"
      description="位置信息接口类型配置。"
      category="location"
      :fields="locationFields"
    />
    <ConfigForm
      title="友情链接"
      description="友情链接页面展示文案配置。"
      category="link"
      :fields="linkFields"
    />
  </div>
</template>

<style scoped>
.other-setting {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
