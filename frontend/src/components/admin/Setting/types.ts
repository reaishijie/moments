import type { updateConfigData } from '@/types/admin'

export type ConfigFieldType = 'text' | 'textarea' | 'password' | 'switch' | 'select'

export interface ConfigFieldSchema {
  key: keyof updateConfigData
  type?: ConfigFieldType
  placeholder?: string
  trueValue?: string
  falseValue?: string
  trueText?: string
  falseText?: string
  options?: Array<{ label: string; value: string }>
  visibleWhen?: (configs: updateConfigData) => boolean
}
