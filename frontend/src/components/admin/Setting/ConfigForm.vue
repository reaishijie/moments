<script setup lang="ts" name="ConfigForm">
import { computed, onMounted } from 'vue'
import { updateConfig } from '@/api/admin'
import { useSettingStore } from '@/store/admin/setting'
import { useMessageStore } from '@/store/message'
import { useUserStore } from '@/store/user'
import router from '@/router'
import type { ConfigDetail, updateConfigData } from '@/types/admin'
import type { ConfigFieldSchema, ConfigFieldType } from './types'

const props = defineProps<{
  title: string
  description?: string
  category: string
  fields?: ConfigFieldSchema[]
}>()

const userStore = useUserStore()
const messageStore = useMessageStore()
const settingStore = useSettingStore()

const schemaMap = computed(() => {
  return (props.fields || []).reduce((acc, field) => {
    acc[field.key] = field
    return acc
  }, {} as Partial<Record<keyof updateConfigData, ConfigFieldSchema>>)
})

const details = computed(() => settingStore.configDetails.filter(item => item.category === props.category))

const visibleDetails = computed(() => {
  if (!props.fields?.length) return details.value
  const order = props.fields.map(field => field.key as string)
  return details.value
    .filter(item => {
      if (!order.includes(item.key)) return false
      const schema = getFieldSchema(item.key)
      return schema?.visibleWhen ? schema.visibleWhen(settingStore.configs) : true
    })
    .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
})

function getFieldSchema(key: string) {
  return schemaMap.value[key as keyof updateConfigData]
}

function getFieldType(item: ConfigDetail): ConfigFieldType {
  const schema = getFieldSchema(item.key)
  if (schema?.type) return schema.type
  if (isBooleanLike(item.value)) return 'switch'
  if (item.description?.length > 30 || item.key.includes('description') || item.key.includes('brief')) return 'textarea'
  if (item.key.includes('pass') || item.key.includes('secret')) return 'password'
  return 'text'
}

function isBooleanLike(value: string) {
  return ['0', '1', 'true', 'false'].includes(String(value))
}

function getTrueValue(item: ConfigDetail) {
  return getFieldSchema(item.key)?.trueValue ?? (['true', 'false'].includes(item.value) ? 'true' : '1')
}

function getFalseValue(item: ConfigDetail) {
  return getFieldSchema(item.key)?.falseValue ?? (['true', 'false'].includes(item.value) ? 'false' : '0')
}

function switchText(item: ConfigDetail) {
  const schema = getFieldSchema(item.key)
  const isOn = settingStore.configs[item.key as keyof updateConfigData] === getTrueValue(item)
  return isOn ? (schema?.trueText || '已开启') : (schema?.falseText || '已关闭')
}

function placeholder(item: ConfigDetail) {
  return getFieldSchema(item.key)?.placeholder || item.description || `请输入${item.name}`
}

onMounted(async () => {
  if (settingStore.configDetails.length) return

  const id = messageStore.show('正在加载设置', 'loading')
  const success = await settingStore.getAllConfig(true)
  if (success) {
    messageStore.update(id, { type: 'success', text: '加载成功', duration: 1600 })
  } else {
    messageStore.update(id, { type: 'error', text: '加载设置失败', duration: 2000 })
    userStore.handleLogout()
    router.replace({ name: 'index' })
  }
})

const handleUpdate = async () => {
  if (!settingStore.hasChanged()) {
    messageStore.show('数据未改动', 'info', 2000)
    return
  }

  const updateData = settingStore.getUpdateData()
  const id = messageStore.show('正在更新中...', 'loading')
  try {
    await updateConfig(updateData)
    messageStore.update(id, { type: 'success', text: '更新成功', duration: 2000 })
    settingStore.syncOriginalData()
  } catch (error) {
    messageStore.update(id, { type: 'error', text: '更新失败', duration: 2000 })
    console.error('更新失败:', error)
  }
}
</script>

<template>
  <section class="config-card">
    <div class="config-head">
      <div>
        <span class="section-label">{{ category }}</span>
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <button class="save-btn" @click="handleUpdate">保存设置</button>
    </div>

    <div v-if="visibleDetails.length" class="config-list">
      <div v-for="item in visibleDetails" :key="item.key" class="config-item">
        <div class="field-meta">
          <label :for="item.key">{{ item.name }}</label>
          <small>{{ item.description || item.key }}</small>
        </div>

        <div class="field-control">
          <label v-if="getFieldType(item) === 'switch'" class="switch-control" :for="item.key">
            <input
              :id="item.key"
              v-model="settingStore.configs[item.key as keyof updateConfigData]"
              type="checkbox"
              :true-value="getTrueValue(item)"
              :false-value="getFalseValue(item)"
            >
            <span class="switch-track"></span>
            <strong>{{ switchText(item) }}</strong>
          </label>

          <select
            v-else-if="getFieldType(item) === 'select'"
            :id="item.key"
            v-model="settingStore.configs[item.key as keyof updateConfigData]"
          >
            <option v-for="option in getFieldSchema(item.key)?.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>

          <textarea
            v-else-if="getFieldType(item) === 'textarea'"
            :id="item.key"
            v-model="settingStore.configs[item.key as keyof updateConfigData]"
            :placeholder="placeholder(item)"
            rows="4"
          ></textarea>

          <input
            v-else
            :id="item.key"
            v-model="settingStore.configs[item.key as keyof updateConfigData]"
            :type="getFieldType(item)"
            :placeholder="placeholder(item)"
          >
        </div>
      </div>
    </div>

    <div v-else class="empty-state">暂无该分类设置</div>
  </section>
</template>

<style scoped>
.config-card {
  border: 1px solid rgba(96, 114, 142, 0.14);
  border-radius: 0;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 24px 80px rgba(53, 82, 125, 0.1);
  backdrop-filter: blur(16px);
  overflow: hidden;
}

.config-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 24px 28px;
  border-bottom: 1px solid rgba(96, 114, 142, 0.12);
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.96), rgba(255, 255, 255, 0.78));
}

.section-label {
  color: #5e9cf4;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.config-head h2 {
  margin: 6px 0 8px;
  color: #172033;
  font-size: 24px;
  letter-spacing: -0.04em;
}

.config-head p {
  margin: 0;
  color: #728097;
  font-size: 14px;
  line-height: 1.7;
}

.save-btn {
  flex: 0 0 auto;
  min-height: 40px;
  padding: 0 18px;
  border: 0;
  border-radius: 0;
  color: #fff;
  font: inherit;
  font-weight: 850;
  background: #172033;
  cursor: pointer;
}

.config-list {
  display: grid;
}

.config-item {
  display: grid;
  grid-template-columns: minmax(180px, 280px) minmax(0, 1fr);
  gap: 24px;
  padding: 20px 28px;
  border-bottom: 1px solid rgba(96, 114, 142, 0.1);
}

.config-item:last-child {
  border-bottom: 0;
}

.field-meta label {
  display: block;
  color: #172033;
  font-size: 15px;
  font-weight: 900;
}

.field-meta small {
  display: block;
  margin-top: 6px;
  color: #728097;
  line-height: 1.6;
}

input,
select,
textarea {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid rgba(96, 114, 142, 0.18);
  border-radius: 0;
  outline: none;
  color: #172033;
  font: inherit;
  background: rgba(248, 251, 255, 0.86);
}

textarea {
  resize: vertical;
  line-height: 1.65;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #75a9ff;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(94, 156, 244, 0.13);
}

.switch-control {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.switch-control input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch-track {
  position: relative;
  width: 48px;
  height: 28px;
  border-radius: 0;
  background: rgba(114, 128, 151, 0.24);
  transition: background 0.18s ease;
}

.switch-track::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  border-radius: 0;
  background: #fff;
  box-shadow: 0 4px 12px rgba(23, 32, 51, 0.2);
  transition: transform 0.18s ease;
}

.switch-control input:checked + .switch-track {
  background: #58c687;
}

.switch-control input:checked + .switch-track::after {
  transform: translateX(20px);
}

.switch-control strong {
  color: #2c3b55;
  font-size: 14px;
}

.empty-state {
  padding: 36px 28px;
  color: #728097;
}

@media (max-width: 720px) {
  .config-head,
  .config-item {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .config-head {
    flex-direction: column;
  }
}
</style>
