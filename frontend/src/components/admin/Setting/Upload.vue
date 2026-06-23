<script setup lang="ts" name="UploadSetting">
import ConfigForm from './ConfigForm.vue'
import type { ConfigFieldSchema } from './types'

const isS3Upload = (configs: { upload_method?: string }) => configs.upload_method === '1'

const fields: ConfigFieldSchema[] = [
  {
    key: 'upload_method',
    type: 'select' as const,
    options: [
      { label: '本地上传', value: '0' },
      { label: 'S3 / R2', value: '1' },
    ],
  },
  { key: 'upload_number', placeholder: '单次最多上传文件数量' },
  { key: 'upload_size', placeholder: '单文件大小限制，单位 M' },
  { key: 'upload_s3_endpoint', placeholder: 'S3 或 R2 端点地址', visibleWhen: isS3Upload },
  { key: 'upload_s3_region', placeholder: 'S3 或 R2 区域，R2 可填 auto', visibleWhen: isS3Upload },
  { key: 'upload_s3_bucketname', placeholder: 'S3 或 R2 存储桶名称', visibleWhen: isS3Upload },
  { key: 'upload_s3_id', placeholder: 'S3 Access Key ID', visibleWhen: isS3Upload },
  { key: 'upload_s3_secret', type: 'password' as const, placeholder: 'S3 Secret Access Key', visibleWhen: isS3Upload },
  { key: 'upload_s3_domain', placeholder: '文件访问域名，不含 https://', visibleWhen: isS3Upload },
]
</script>

<template>
  <ConfigForm
    title="上传设置"
    description="文件上传方式、数量大小限制，以及 S3 / R2 对象存储连接配置。"
    category="upload"
    :fields="fields"
  />
</template>
