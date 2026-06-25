<script setup lang="ts" name="ALink">
import { computed, ref } from 'vue'
import { createLink, deleteLink, getAllLinks, updateLink } from '@/api/admin'
import type { adminLinkFormData, linkData } from '@/types/link'
import { useMessageStore } from '@/store/message'

const messageStore = useMessageStore()

const initialFilter = {
  linkId: '',
  sitename: '',
  url: '',
  brief: '',
  status: '',
}

const initialForm: adminLinkFormData = {
  logo: '',
  sitename: '',
  brief: '',
  url: '',
  status: 1,
}

const linkFilter = ref({ ...initialFilter })
const links = ref<linkData[]>([])
const togglingLinkIds = ref<Set<string>>(new Set())
const pagination = ref({ page: 1, pageSize: 10, total: 0 })
const loading = ref(false)
const showModal = ref(false)
const saving = ref(false)
const editingLink = ref<linkData | null>(null)
const linkForm = ref<adminLinkFormData>({ ...initialForm })

const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.pageSize))

const buildParams = () => {
  const params: Record<string, any> = {
    page: pagination.value.page,
    pageSize: pagination.value.pageSize,
  }
  if (linkFilter.value.linkId) params.linkId = linkFilter.value.linkId
  if (linkFilter.value.sitename) params.sitename = linkFilter.value.sitename
  if (linkFilter.value.url) params.url = linkFilter.value.url
  if (linkFilter.value.brief) params.brief = linkFilter.value.brief
  if (linkFilter.value.status !== '') params.status = linkFilter.value.status
  return params
}

const handleSearch = async () => {
  loading.value = true
  try {
    const res = await getAllLinks(buildParams())
    links.value = res.data.data || []
    pagination.value = {
      page: res.data.page || 1,
      pageSize: res.data.pageSize || 10,
      total: res.data.total || 0,
    }
  } catch (error) {
    console.error('获取友情链接失败:', error)
    messageStore.show('获取友情链接失败', 'error', 3000)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  linkFilter.value = { ...initialFilter }
  pagination.value.page = 1
  handleSearch()
}

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value || page === pagination.value.page) return
  pagination.value.page = page
  handleSearch()
}

const handlePageSizeChange = (pageSize?: number) => {
  if (pageSize) pagination.value.pageSize = Number(pageSize)
  pagination.value.page = 1
  handleSearch()
}

const getVisiblePages = () => {
  const current = pagination.value.page
  const total = totalPages.value
  const pages: (number | string)[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current <= 4) {
      for (let i = 2; i <= 5; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push('...')
      for (let i = total - 4; i <= total; i++) if (i > 1) pages.push(i)
    } else {
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push('...')
      pages.push(total)
    }
  }

  return pages
}

const openCreateModal = () => {
  editingLink.value = null
  linkForm.value = { ...initialForm }
  showModal.value = true
}

const openEditModal = (link: linkData) => {
  editingLink.value = link
  linkForm.value = {
    logo: link.logo || '',
    sitename: link.sitename,
    brief: link.brief || '',
    url: link.url,
    status: Number(link.status),
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  saving.value = false
  editingLink.value = null
  linkForm.value = { ...initialForm }
}

const saveLink = async () => {
  if (!linkForm.value.sitename.trim() || !linkForm.value.url.trim()) {
    messageStore.show('站点名称和链接地址不能为空', 'error', 2500)
    return
  }

  saving.value = true
  const loadingId = messageStore.show('正在保存友情链接...', 'loading')
  try {
    const payload = {
      ...linkForm.value,
      sitename: linkForm.value.sitename.trim(),
      url: linkForm.value.url.trim(),
      logo: linkForm.value.logo?.trim() || null,
      brief: linkForm.value.brief?.trim() || null,
    }

    if (editingLink.value) {
      await updateLink(editingLink.value.id, payload)
      messageStore.update(loadingId, { text: '友情链接更新成功', type: 'success', duration: 2000 })
    } else {
      await createLink(payload)
      messageStore.update(loadingId, { text: '友情链接新增成功', type: 'success', duration: 2000 })
    }
    closeModal()
    handleSearch()
  } catch (error) {
    console.error('保存友情链接失败:', error)
    messageStore.update(loadingId, { text: '保存失败，请稍后重试', type: 'error', duration: 3000 })
  } finally {
    saving.value = false
  }
}

const toggleLinkStatus = async (link: linkData) => {
  if (togglingLinkIds.value.has(link.id)) return

  const nextStatus = link.status === 1 ? 0 : 1
  togglingLinkIds.value.add(link.id)
  const loadingId = messageStore.show(`正在${nextStatus === 1 ? '显示' : '隐藏'}友情链接...`, 'loading')

  try {
    await updateLink(link.id, { status: nextStatus })
    link.status = nextStatus
    messageStore.update(loadingId, { text: '友情链接状态切换成功', type: 'success', duration: 2000 })
  } catch (error) {
    console.error('切换友情链接状态失败:', error)
    messageStore.update(loadingId, { text: '切换失败，请稍后重试', type: 'error', duration: 3000 })
  } finally {
    togglingLinkIds.value.delete(link.id)
  }
}

const handleDelete = async (link: linkData) => {
  if (!window.confirm(`确定要删除友情链接「${link.sitename}」吗？`)) return
  const loadingId = messageStore.show('正在删除友情链接...', 'loading')
  try {
    await deleteLink(link.id)
    messageStore.update(loadingId, { text: '友情链接删除成功', type: 'success', duration: 2000 })
    if (links.value.length === 1 && pagination.value.page > 1) pagination.value.page -= 1
    handleSearch()
  } catch (error) {
    console.error('删除友情链接失败:', error)
    messageStore.update(loadingId, { text: '删除失败，请稍后重试', type: 'error', duration: 3000 })
  }
}

handleSearch()
</script>

<template>
  <section class="link-admin">
    <div class="top">
      <form class="filter-form" @submit.prevent="handleSearch">
        <label for="link_id" title="友链ID">友链ID：
          <input id="link_id" v-model="linkFilter.linkId" type="number" placeholder="友链ID">
        </label>
        <label for="sitename" title="站点名称">站点名称：
          <input id="sitename" v-model="linkFilter.sitename" type="text" placeholder="站点名称(支持模糊查询)">
        </label>
        <label for="url" title="链接地址">链接地址：
          <input id="url" v-model="linkFilter.url" type="text" placeholder="链接地址(支持模糊查询)">
        </label>
        <label for="status" title="状态">状态：
          <select id="status" v-model="linkFilter.status">
            <option value="">全部</option>
            <option value="1">显示</option>
            <option value="0">隐藏/待审核</option>
          </select>
        </label>
        <button type="submit">查询</button>
        <button type="button" @click="resetForm">重置</button>
        <button type="button" class="create-btn" @click="openCreateModal">新增友链</button>
      </form>
    </div>

    <div class="list">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>站点</th>
              <th>简介</th>
              <th>链接</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="empty-cell">正在加载友情链接...</td>
            </tr>
            <tr v-else-if="links.length === 0">
              <td colspan="7" class="empty-cell">暂无友情链接</td>
            </tr>
            <tr v-for="item in links" v-else :key="item.id">
              <td>{{ item.id }}</td>
              <td>
                <div class="site-cell">
                  <img :src="item.logo || '/img/avatar.jpg'" alt="友链LOGO">
                  <i>{{ item.sitename }}</i>
                </div>
              </td>
              <td class="brief-cell">
                <div class="brief-content">{{ item.brief || '未设置简介' }}</div>
              </td>
              <td class="url-cell"><a :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.url }}</a></td>
              <td>
                <button
                  type="button"
                  :class="['status-badge', 'toggle-badge', `status-${item.status}`]"
                  :disabled="togglingLinkIds.has(item.id)"
                  :title="item.status === 1 ? '点击隐藏友链' : '点击显示友链'"
                  @click="toggleLinkStatus(item)"
                >
                  {{ item.status === 1 ? '显示' : '隐藏' }}
                </button>
              </td>
              <td class="time-cell">{{ item.created_at }}</td>
              <td>
                <button type="button" class="edit-btn" @click="openEditModal(item)">编辑</button>
                <button type="button" class="delete-btn" @click="handleDelete(item)">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-info">
        <span>共 {{ pagination.total }} 条记录</span>
        <select v-model="pagination.pageSize" class="page-size-select" @change="handlePageSizeChange(pagination.pageSize)">
          <option value="10">10条/页</option>
          <option value="20">20条/页</option>
          <option value="50">50条/页</option>
        </select>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button class="pagination-btn" :disabled="pagination.page <= 1" @click="handlePageChange(pagination.page - 1)">上一页</button>
        <template v-for="(page, index) in getVisiblePages()" :key="index">
          <span v-if="page === '...'" class="pagination-ellipsis">...</span>
          <button
            v-else
            :class="['pagination-btn', { active: page === pagination.page }]"
            @click="handlePageChange(page as number)"
          >
            {{ page }}
          </button>
        </template>
        <button class="pagination-btn" :disabled="pagination.page >= totalPages" @click="handlePageChange(pagination.page + 1)">下一页</button>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ editingLink ? '编辑友链' : '新增友链' }}</h3>
          <button type="button" class="modal-close" @click="closeModal">×</button>
        </div>
        <form class="edit-form" @submit.prevent="saveLink">
          <div class="modal-body">
            <div class="form-group">
              <label>站点名称</label>
              <input v-model="linkForm.sitename" type="text" maxlength="255" required placeholder="站点名称">
            </div>
            <div class="form-group">
              <label>链接地址</label>
              <input v-model="linkForm.url" type="url" maxlength="255" required placeholder="https://example.com">
            </div>
            <div class="form-group">
              <label>LOGO 地址</label>
              <input v-model="linkForm.logo" type="url" maxlength="255" placeholder="可选，站点 LOGO 图片链接">
            </div>
            <div class="form-group">
              <label>站点简介</label>
              <textarea v-model="linkForm.brief" maxlength="255" rows="3" placeholder="可选"></textarea>
            </div>
            <div class="form-group">
              <label>展示状态</label>
              <select v-model.number="linkForm.status">
                <option :value="1">显示</option>
                <option :value="0">隐藏/待审核</option>
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="modal-cancel-btn" @click="closeModal">取消</button>
            <button type="submit" class="modal-save-btn" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>

<style scoped>
.link-admin {
  padding-bottom: 92px;
}

.top,
.list,
.pagination-wrapper,
.modal-container {
  border: 1px solid rgba(96, 114, 142, 0.14);
  border-radius: 0;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 24px 80px rgba(53, 82, 125, 0.10);
  backdrop-filter: blur(16px);
}

.top {
  position: relative;
  overflow: hidden;
  padding: 24px;
}

.top::before {
  content: '筛选器';
  display: block;
  margin-bottom: 14px;
  color: #172033;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.top::after {
  content: '';
  position: absolute;
  top: -80px;
  right: -90px;
  width: 220px;
  height: 220px;
  border-radius: 0;
  background: radial-gradient(circle, rgba(114, 216, 255, 0.26), transparent 68%);
  pointer-events: none;
}

.filter-form {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
  align-items: end;
  margin: 0;
}

label,
.form-group label {
  display: grid;
  gap: 7px;
  color: #526176;
  font-size: 13px;
  font-weight: 800;
  white-space: normal;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;
  margin: 0;
  padding: 11px 13px;
  border: 1px solid rgba(96, 114, 142, 0.18);
  border-radius: 0;
  outline: none;
  color: #172033;
  font: inherit;
  background: rgba(248, 251, 255, 0.86);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
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

button {
  border: 0;
  border-radius: 0;
  font: inherit;
  font-weight: 850;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, opacity 0.18s ease;
}

.filter-form > button {
  min-height: 42px;
  padding: 0 18px;
  color: #fff;
  background: #172033;
  box-shadow: 0 16px 34px rgba(23, 32, 51, 0.16);
}

.filter-form > button[type='button'] {
  color: #2c3b55;
  background: #edf5ff;
  box-shadow: none;
}

.filter-form > .create-btn {
  color: #fff;
  background: #172033;
  box-shadow: 0 16px 34px rgba(23, 32, 51, 0.16);
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.list {
  overflow: hidden;
  margin-top: 20px;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 980px;
  border-collapse: separate;
  border-spacing: 0;
}

thead {
  background: linear-gradient(180deg, rgba(248, 251, 255, 0.96), rgba(241, 247, 253, 0.96));
}

th,
td {
  padding: 16px 14px;
  border-bottom: 1px solid rgba(96, 114, 142, 0.12);
  color: #2c3b55;
  font-size: 14px;
  text-align: left;
  vertical-align: middle;
}

th {
  color: #728097;
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

tbody tr {
  transition: background 0.18s ease;
}

tbody tr:hover {
  background: rgba(237, 245, 255, 0.72);
}

tbody tr:last-child td {
  border-bottom: 0;
}

td:last-child {
  white-space: nowrap;
}

.site-cell {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.site-cell img {
  width: 38px;
  height: 38px;
  border-radius: 0;
  object-fit: cover;
  box-shadow: 0 8px 20px rgba(53, 82, 125, 0.12);
}

.site-cell i {
  color: #172033;
  font-style: normal;
  font-weight: 850;
}

.brief-cell,
.time-cell,
.url-cell {
  color: #526176;
}

.brief-content {
  max-width: 300px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.55;
}

.url-cell a {
  color: #3d75c4;
  text-decoration: none;
  word-break: break-all;
}

.url-cell a:hover {
  text-decoration: underline;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 0;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.status-1 {
  color: #23704a;
  background: rgba(88, 198, 135, 0.14);
}

.status-0 {
  color: #526176;
  background: rgba(114, 128, 151, 0.12);
}

.toggle-badge {
  border: 0;
  cursor: pointer;
}

.toggle-badge:hover:not(:disabled) {
  box-shadow: 0 8px 18px rgba(53, 82, 125, 0.12);
}

.toggle-badge:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.edit-btn,
.delete-btn,
.pagination-btn,
.modal-actions button {
  min-height: 34px;
  padding: 0 12px;
  margin: 3px;
}

.edit-btn {
  color: #245fae;
  background: rgba(94, 156, 244, 0.13);
}

.delete-btn {
  color: #b54d5a;
  background: rgba(236, 111, 125, 0.13);
}

.empty-cell {
  padding: 34px;
  color: #728097;
  text-align: center;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  padding: 16px 18px;
}

.pagination-info,
.pagination {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  color: #728097;
  font-size: 13px;
}

.page-size-select {
  width: auto;
  min-width: 108px;
  padding: 9px 12px;
}

.pagination-btn {
  min-width: 36px;
  min-height: 36px;
  padding: 0 12px;
  color: #2c3b55;
  background: #edf5ff;
}

.pagination-btn.active {
  color: #fff;
  background: #172033;
}

.pagination-ellipsis {
  color: #9aa6b6;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(8, 18, 35, 0.54);
  backdrop-filter: blur(8px);
}

.modal-container {
  display: flex;
  flex-direction: column;
  width: min(720px, 100%);
  max-height: min(86vh, 900px);
  overflow: hidden;
  background: var(--color-bg-app);
  box-shadow: var(--color-shadow);
  backdrop-filter: none;
}

.modal-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px 12px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 700;
}

.modal-close {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  color: #787878;
  font-size: 24px;
  line-height: 1;
  background: var(--color-ad);
}

.modal-close:hover {
  color: var(--color-text-primary);
  background: var(--color-ad-hover);
}

.edit-form {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  gap: 0;
  overflow: hidden;
}

.modal-body {
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  gap: 14px;
  overflow-y: auto;
  padding: 20px 24px 10px;
}

.form-group {
  display: grid;
  gap: 8px;
}

.form-group > label {
  width: auto;
  padding: 0;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
}

.modal-container input,
.modal-container select,
.modal-container textarea {
  width: 100%;
  max-width: none;
  padding: 10px 12px;
  border: 1px solid rgba(96, 114, 142, 0.18);
  border-radius: 0;
  color: var(--color-text-primary);
  background: rgba(248, 251, 255, 0.72);
  box-shadow: none;
}

.modal-container textarea {
  min-height: 96px;
}

.modal-container input:focus,
.modal-container select:focus,
.modal-container textarea:focus {
  border-color: #6cadf1;
  background: var(--color-bg-app);
  box-shadow: 0 0 0 4px rgba(94, 156, 244, 0.13);
}

.modal-actions {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 22px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(96, 114, 142, 0.12);
}

.modal-cancel-btn {
  min-height: 40px;
  padding: 0 16px;
  color: #2c3b55;
  background: #edf5ff;
}

.modal-save-btn {
  min-height: 40px;
  padding: 0 18px;
  color: #fff;
  background: #172033;
}

@media (max-width: 768px) {
  .pagination-wrapper {
    align-items: flex-start;
    flex-direction: column;
  }

  .modal-body {
    padding: 16px 18px 8px;
  }
}
</style>
