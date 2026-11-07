import 'vue-router'

/**
 * 补充路由 meta 的字段类型，避免 `to.meta.title` 被推断成 unknown 后
 * 污染 document.title 等字符串赋值处。
 */
declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题，用于 document.title */
    title?: string
    /** 是否要求登录 */
    login?: boolean
  }
}
