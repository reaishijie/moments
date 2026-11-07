/// <reference types="vite/client" />

/**
 * 构建期环境变量声明。
 *
 * 这里统一声明为 string，与运行时对缺失变量的兜底保持一致（见 utils/siteMeta.ts），
 * 避免把未定义的情况扩散到所有调用点。
 */
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_KEYWORD: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
