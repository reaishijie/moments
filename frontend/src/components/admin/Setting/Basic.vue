<script setup lang="ts" name="Basic">
import ConfigForm from './ConfigForm.vue'
import type { ConfigFieldSchema } from './types'

const fields: ConfigFieldSchema[] = [
  { key: 'sitename', placeholder: '在此输入网站名称' },
  { key: 'site_url', placeholder: '网站公开访问地址' },
  { key: 'site_email', placeholder: '管理员联系邮箱' },
  { key: 'site_keywords', placeholder: '关键词，使用逗号分隔' },
  { key: 'site_description', type: 'textarea' as const, placeholder: '站点描述' },
  { key: 'site_background', placeholder: '公共页面背景图片地址' },
  { key: 'site_logo', placeholder: '站点 Logo 图片地址' },
  { key: 'site_font', placeholder: '字体族名或字体文件地址，如 "LXGW WenKai", sans-serif / https://example.com/font.woff2' },
  { key: 'site_header_background', placeholder: '首页 Header 背景图片地址' },
  { key: 'site_avatar', placeholder: '首页头像图片地址' },
  { key: 'site_brief', type: 'textarea' as const, placeholder: '首页简介文案' },
]
</script>

<template>
  <ConfigForm
    title="基础设置"
    description="站点展示、SEO、首页资料等公共信息。字段名称、描述和值均来自后端配置元数据。"
    category="site"
    :fields="fields"
  />
</template>
