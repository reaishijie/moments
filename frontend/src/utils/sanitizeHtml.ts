const ALLOWED_TAGS = new Set([
  'a',
  'br',
  'div',
  'em',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'small',
  'span',
  'strong',
  'ul',
])

const GLOBAL_ATTRS = new Set(['class', 'title', 'aria-label'])
const TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height']),
}

function isSafeUrl(value: string) {
  const url = value.trim().replace(/[\u0000-\u001F\u007F\s]+/g, '')
  return !/^(javascript|vbscript|data):/i.test(url)
}

function sanitizeElement(element: Element) {
  const tagName = element.tagName.toLowerCase()

  if (!ALLOWED_TAGS.has(tagName)) {
    element.replaceWith(...Array.from(element.childNodes))
    return
  }

  for (const attr of Array.from(element.attributes)) {
    const attrName = attr.name.toLowerCase()
    const allowedAttrs = TAG_ATTRS[tagName]
    const isAllowed = GLOBAL_ATTRS.has(attrName) || allowedAttrs?.has(attrName)

    if (!isAllowed || attrName.startsWith('on')) {
      element.removeAttribute(attr.name)
      continue
    }

    if ((attrName === 'href' || attrName === 'src') && !isSafeUrl(attr.value)) {
      element.removeAttribute(attr.name)
    }
  }

  if (tagName === 'a') {
    const anchor = element as HTMLAnchorElement
    if (anchor.href && anchor.target === '_blank') {
      anchor.rel = 'noopener noreferrer'
    }
  }
}

export function sanitizeHtml(html?: string) {
  if (!html || typeof window === 'undefined') return ''

  const template = document.createElement('template')
  template.innerHTML = html

  const walk = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT)
  const elements: Element[] = []
  while (walk.nextNode()) {
    elements.push(walk.currentNode as Element)
  }

  elements.forEach(sanitizeElement)
  return template.innerHTML
}
