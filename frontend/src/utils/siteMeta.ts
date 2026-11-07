const DEFAULT_TITLE = '瞬刻'

function upsertMeta(name: string, content?: string) {
  if (!content) return

  let meta = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

/**
 * 用构建期环境变量补齐 SEO 元信息。
 *
 * 直接在 index.html 里写 %VITE_APP_DESCRIPTION% 时，变量未定义会被原样输出，
 * 因此改为运行时注入，并对缺失的变量做兜底。
 */
export function applySiteMeta() {
  const title = import.meta.env.VITE_APP_TITLE?.trim() || DEFAULT_TITLE

  if (!document.title) {
    document.title = title
  }

  upsertMeta('description', import.meta.env.VITE_APP_DESCRIPTION?.trim() || undefined)
  upsertMeta('keywords', import.meta.env.VITE_APP_KEYWORD?.trim() || undefined)
}
