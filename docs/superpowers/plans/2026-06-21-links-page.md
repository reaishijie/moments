# Links Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the friend links popup with a dedicated `/links` frontend page rendered in the main content area.

**Architecture:** Add a focused `Links.vue` view that owns link loading and page rendering. Add a `/links` child route under `FrontLayout`, then simplify `Header.vue` so the Hive icon navigates to the route instead of toggling a mounted popup component.

**Tech Stack:** Vue 3 `<script setup>`, Vue Router, Pinia default store, existing `getLink()` API, TypeScript, Vite.

---

## File Structure

- Create `frontend/src/views/Links.vue`: page component for site intro, friend link list, loading, empty, and error states.
- Modify `frontend/src/router/frontend.ts`: register `/links` as a frontend child route.
- Modify `frontend/src/components/Header.vue`: remove popup wiring and navigate to `links`.
- Delete `frontend/src/components/Link.vue`: obsolete popup component after confirming no references remain.

### Task 1: Add Links View

**Files:**
- Create: `frontend/src/views/Links.vue`

- [ ] **Step 1: Create the page component**

Use this complete component:

```vue
<script setup lang="ts" name="Links">
import { computed, onMounted, ref } from 'vue'
import { getLink } from '@/api/link'
import { useDefaultStore } from '@/store/default'
import type { linkData } from '@/types/link'

const defaultStore = useDefaultStore()
const links = ref<linkData[]>([])
const isLoading = ref(false)
const loadFailed = ref(false)

const siteLogo = computed(() => {
  return defaultStore.configs.site_logo || defaultStore.configs.site_avatar || '/img/avatar.jpg'
})

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(async () => {
  isLoading.value = true
  loadFailed.value = false

  try {
    const res = await getLink()
    links.value = res.data
  } catch (error) {
    loadFailed.value = true
    console.error('加载链接数据失败:', error)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <main class="links-page">
    <section class="links-hero">
      <img class="site-logo" :src="siteLogo" alt="站点LOGO">
      <div class="site-info">
        <h1>{{ defaultStore.configs.sitename || '友情链接' }}</h1>
        <p>{{ defaultStore.configs.link_brief || '欢迎访问这些朋友的站点' }}</p>
      </div>
    </section>

    <section class="links-content">
      <h2>友情链接</h2>

      <div v-if="isLoading" class="state-text">正在加载友情链接...</div>
      <div v-else-if="loadFailed" class="state-text">友情链接加载失败，请稍后重试</div>
      <div v-else-if="links.length === 0" class="state-text">暂时还没有友情链接</div>

      <ul v-else class="link-list">
        <li v-for="link in links" :key="link.id">
          <button class="link-item" type="button" @click="openUrl(link.url)">
            <img :src="link.logo ? link.logo : '/img/avatar.jpg'" alt="友链LOGO">
            <span class="link-text">
              <span class="link-name">{{ link.sitename }}</span>
              <span class="link-brief">{{ link.brief ? link.brief : '暂时未设置站点介绍' }}</span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.links-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  padding: 18px;
  box-sizing: border-box;
}

.links-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 0;
  border-bottom: 1px solid rgba(128, 128, 128, 0.18);
}

.site-logo {
  width: 54px;
  height: 54px;
  border-radius: 8px;
  object-fit: cover;
  flex: 0 0 auto;
}

.site-info {
  min-width: 0;
}

.site-info h1 {
  margin: 0;
  font-size: 20px;
  line-height: 1.3;
}

.site-info p {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.links-content h2 {
  margin: 0 0 12px;
  font-size: 17px;
}

.state-text {
  padding: 24px 0;
  color: var(--color-text-secondary);
  text-align: center;
}

.link-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.link-list li + li {
  border-top: 1px solid rgba(128, 128, 128, 0.12);
}

.link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 4px;
  border: 0;
  color: inherit;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
}

.link-item:hover {
  background-color: rgba(128, 128, 128, 0.12);
}

.link-item img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex: 0 0 auto;
}

.link-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
}

.link-name {
  font-weight: 600;
}

.link-brief {
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}
</style>
```

- [ ] **Step 2: Run the focused build check**

Run: `cd frontend && npm run build`

Expected: build may fail before routing is added because the view is not referenced yet only if unrelated existing issues exist; record any error exactly before continuing.

### Task 2: Add Route and Header Navigation

**Files:**
- Modify: `frontend/src/router/frontend.ts`
- Modify: `frontend/src/components/Header.vue`

- [ ] **Step 1: Register the `/links` route**

In `frontend/src/router/frontend.ts`, add this child route after `index`:

```ts
{
    path: '/links',
    name: 'links',
    component: () => import('@/views/Links.vue'),
    meta: { title: '友情链接' }
},
```

- [ ] **Step 2: Remove popup imports and state from Header**

In `frontend/src/components/Header.vue`, replace:

```ts
import Link from '@/components/Link.vue';
```

with nothing. Remove this block:

```ts
type ExposedApi = {
  toggleShowLink: () => void
}
const linkRef = ref<ExposedApi | null>(null)
const toggleShow = () => {
  linkRef.value?.toggleShowLink()
}
```

- [ ] **Step 3: Replace the template popup mount and click handler**

Remove this line inside `.header`:

```vue
<Link ref="linkRef" />
```

Replace:

```vue
<div class="link" @click="toggleShow">
```

with:

```vue
<div class="link" @click="router.push({ name: 'links' })">
```

- [ ] **Step 4: Run TypeScript build**

Run: `cd frontend && npm run build`

Expected: no TypeScript error for missing `Link`, `linkRef`, or `toggleShow`.

### Task 3: Remove Obsolete Popup Component

**Files:**
- Delete: `frontend/src/components/Link.vue`

- [ ] **Step 1: Confirm no references remain**

Run: `rg -n "components/Link|<Link|toggleShowLink|linkRef|toggleShow" frontend/src`

Expected: no matches for the deleted popup component or exposed toggle API. Matches for unrelated icon imports named `Link` in article components are acceptable only if they do not reference `@/components/Link.vue`.

- [ ] **Step 2: Delete the popup component**

Delete `frontend/src/components/Link.vue`.

- [ ] **Step 3: Run final build**

Run: `cd frontend && npm run build`

Expected: Vue type-check and Vite build complete successfully.

### Task 4: Manual Verification

**Files:**
- No file changes.

- [ ] **Step 1: Start the frontend dev server**

Run: `cd frontend && npm run dev`

Expected: Vite prints a local URL such as `http://localhost:5173/`.

- [ ] **Step 2: Verify browser behavior**

Open the local URL. Click the header friend links icon. Expected: browser navigates to `/links`, the page renders inside the app container, no popup appears, browser Back returns to the previous route, and clicking a link row opens the external URL in a new tab.

- [ ] **Step 3: Commit implementation**

Stage only implementation files:

```bash
git add frontend/src/views/Links.vue frontend/src/router/frontend.ts frontend/src/components/Header.vue frontend/src/components/Link.vue
git commit -m "feat: add links page route"
```

If `frontend/src/components/Link.vue` was already absent, omit it from `git add`.
