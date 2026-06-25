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

const customFields: ConfigFieldSchema[] = [
  { key: 'site_footer_html', type: 'textarea' as const, placeholder: '底部版权、备案号、社交链接等 HTML' },
  { key: 'site_left_corner_html', type: 'textarea' as const, placeholder: '左下角悬浮信息 HTML' },
  { key: 'site_right_corner_html', type: 'textarea' as const, placeholder: '右下角悬浮信息 HTML' },
  {
    key: 'site_stat_enabled',
    type: 'switch' as const,
    trueValue: '1',
    falseValue: '0',
    trueText: '已启用',
    falseText: '已关闭',
  },
  { key: 'site_stat_script_url', placeholder: '统计脚本地址，例如 //js.llk.hk' },
  { key: 'site_stat_site_id', placeholder: '统计站点 ID，例如 cf7191d1' },
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
    <ConfigForm
      title="自定义展示与统计"
      description="配置 Footer、左右下角 HTML，以及结构化统计脚本。HTML 会在前台渲染前过滤危险标签和属性。"
      category="custom"
      :fields="customFields"
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
