<script setup lang="ts" name="AArticle">
import { ref, computed } from 'vue'
import AvatarImage from '@/components/utils/AvatarImage.vue';
import type { articleFilter, articleData, updateArticleData } from '@/types/article';
import { getArticle, updateArticle, deleteArticle } from '@/api/articles';
import { useMessageStore } from '@/store/message';

const initialArticleData = {
  articleId: '',
  userId: '',
  content: '',
  location: '',
  tag: '',
  type: -1,
  is_top: false,
  is_ad: false,
}

const article = ref<articleFilter>({ ...initialArticleData })
const articles = ref<articleData[]>([])
const pagination = ref({
  page: 1,
  pageSize: 5,
  total: 0
})

const resetForm = () => {
  article.value = { ...initialArticleData }
  pagination.value.page = 1
  handleSearch()
}

const handleSearch = async () => {
  const params: any = {
    page: pagination.value.page,
    pageSize: pagination.value.pageSize
  }
  if (article.value.articleId) params.articleId = Number(article.value.articleId)
  if (article.value.userId) params.userId = Number(article.value.userId)
  if (article.value.content) params.content = article.value.content
  if (article.value.location) params.location = article.value.location
  if (article.value.tag) params.tag = article.value.tag
  if (article.value.type !== -1) params.type = article.value.type
  if (article.value.isTop) params.isTop = article.value.isTop
  if (article.value.isAd) params.isAd = article.value.isAd
  
  const res = await getArticle(params)
  articles.value = res.data.data
  pagination.value = {
    page: res.data.page,
    pageSize: res.data.pageSize,
    total: res.data.total
  }
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  handleSearch()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  handleSearch()
}

const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.pageSize))

const getVisiblePages = () => {
  const current = pagination.value.page
  const total = totalPages.value
  const pages: (number | string)[] = []
  
  if (total <= 7) {
    // 总页数少于等于7页，显示所有页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总是显示第1页
    pages.push(1)
    
    if (current <= 4) {
      // 当前页在前4页
      for (let i = 2; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      // 当前页在后4页
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        if (i > 1) pages.push(i)
      }
    } else {
      // 当前页在中间
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
}

const messageStore = useMessageStore()

// 编辑文章相关状态
const editingArticle = ref<articleData | null>(null)
const showEditModal = ref(false)
const editForm = ref<updateArticleData>({})
const imageData = ref('')
const videoData = ref('')
const tagData = ref('')
const editStates = ref({
  saving: false
})

// 确认对话框相关状态
const showConfirmDialog = ref(false)
const confirmData = ref({
  title: '',
  message: '',
  onConfirm: () => {},
  onCancel: () => {}
})

// 显示确认对话框
const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
  confirmData.value = {
    title,
    message,
    onConfirm,
    onCancel: onCancel || (() => {})
  }
  showConfirmDialog.value = true
}

// 关闭确认对话框
const closeConfirmDialog = () => {
  showConfirmDialog.value = false
}

// 删除文章
const handleDelete = async (articleId: string) => {
  showConfirm(
    '确认删除',
    '确定要删除这篇文章吗？此操作不可恢复！',
    async () => {
      const loadingId = messageStore.show('正在删除文章...', 'loading')
      try {
        await deleteArticle(articleId)
        messageStore.update(loadingId, { text: '文章删除成功！', type: 'success', duration: 2000 })
        handleSearch()
        closeConfirmDialog()
      } catch (error) {
        console.error('删除文章失败:', error)
        messageStore.update(loadingId, { text: '删除失败，请稍后重试', type: 'error', duration: 3000 })
      }
    }
  )
}

// 打开编辑弹窗
const openEditModal = (item: articleData) => {
  editingArticle.value = item
  editForm.value = {
    content: item.content,
    type: item.type,
    location: item.location,
    isTop: item.is_top,
    isAd: item.is_ad
  }
  
  // 处理图片链接
  if (item.article_images && item.article_images.length > 0) {
    imageData.value = item.article_images.map(img => img.image_url).join('\n')
  } else {
    imageData.value = ''
  }
  
  // 处理视频链接
  if (item.article_videos && item.article_videos.length > 0) {
    videoData.value = item.article_videos.map((video: any) => video.video_url || video.url || '').filter(Boolean).join('\n')
  } else {
    videoData.value = ''
  }

  tagData.value = item.tags?.map(tag => tag.name).join(' ') || ''

  showEditModal.value = true
}

// 关闭编辑弹窗
const closeEditModal = () => {
  showEditModal.value = false
  editingArticle.value = null
  editForm.value = {}
  imageData.value = ''
  videoData.value = ''
  tagData.value = ''
  editStates.value.saving = false
}


// 保存编辑
const handleEdit = async () => {
  if (!editingArticle.value) return
  
  if (!editForm.value.content && (!imageData.value?.trim()) && (!videoData.value?.trim())) {
    messageStore.show('文章内容不能为空', 'info', 2000)
    return
  }
  
  if (editStates.value.saving) {
    messageStore.show('请勿重复点击', 'info', 2000)
    return
  }
  
  const loadingId = messageStore.show('正在更新文章...', 'loading')
  editStates.value.saving = true
  
  try {
    const updateData: updateArticleData = {}
    if (editForm.value.content) updateData.content = editForm.value.content
    if (editForm.value.type !== undefined) updateData.type = editForm.value.type
    if (editForm.value.location) updateData.location = editForm.value.location
    if (editForm.value.isTop !== undefined) updateData.isTop = editForm.value.isTop
    if (editForm.value.isAd !== undefined) updateData.isAd = editForm.value.isAd
    updateData.tags = Array.from(new Set(
      tagData.value
        .split(/[\s,，#]+/)
        .map(tag => tag.trim())
        .filter(Boolean)
        .map(tag => tag.slice(0, 50))
    )).slice(0, 5)
    
    // 处理图片URL - 参考Post.vue的方式
    if (editForm.value.type == 1) {
      const urls = imageData.value
        .split(/[\s,]+|[\n]+/)
        .map(url => url.trim())
        .filter(url => url)
      updateData.imageUrls = urls
    }
    
    // 处理视频URL - 参考Post.vue的方式
    if (editForm.value.type == 2) {
      const urls = videoData.value
        .split(/[\s,]+|[\n]+/)
        .map(url => url.trim())
        .filter(url => url)
      updateData.videoUrls = urls
    }
    
    await updateArticle(editingArticle.value.id, updateData)
    closeEditModal()
    handleSearch()
    messageStore.update(loadingId, { text: '文章更新成功！', type: 'success', duration: 2000 })
  } catch (error) {
    console.error('更新文章失败:', error)
    messageStore.update(loadingId, { text: '更新失败，请稍后重试', type: 'error', duration: 3000 })
  } finally {
    editStates.value.saving = false
  }
}

handleSearch()
</script>

<template>
  <div class="top">
    <form @submit.prevent="handleSearch">
      <label for="id" title="文章ID">文章ID：
        <input type="number" id="id" placeholder="文章ID" v-model="article.articleId">
      </label>
      <label for="user_id" title="用户ID">用户ID：
        <input type="number" id="user_id" placeholder="用户ID" v-model="article.userId">
      </label>
      <label for="content" title="文章内容">文章内容：
        <input type="text" id="content" placeholder="文章内容(支持模糊查询)" v-model="article.content">
      </label>
      <label for="location" title="位置">位置：
        <input type="text" id="location" placeholder="位置(支持模糊查询)" v-model="article.location">
      </label>
      <label for="tag" title="标签">标签：
        <input type="text" id="tag" placeholder="标签精确查询" v-model="article.tag">
      </label>
      <label for="type" title="文章类型">文章类型：
        <select name="articleType" id="type" v-model="article.type">
          <option value="-1">请选择</option>
          <option value="0">普通</option>
          <option value="1">图文</option>
          <option value="2">视频</option>
        </select>
      </label>
      <button type="submit">查询</button>
      <button type="button" @click="resetForm">重置</button>
    </form>
  </div>

  <div class="list">
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>用户</th>
          <th>内容</th>
          <th>标签</th>
          <th>类型</th>
          <th>置顶</th>
          <th>广告</th>
          <th>评论/点赞</th>
          <th>发布时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in articles" :key="item.id">
          <td>{{ item.id }}</td>
          <td>
            <div class="user-cell" :title="'用户id：' + item.user.id">
              <AvatarImage :src="item.user.avatar" alt="" />
              <i>@{{ item.user.username }}</i>
            </div>
          </td>
          <td>{{ item.content.slice(0, 50) }}{{ item.content.length > 50 ? '...' : '' }}</td>
          <td>
            <div class="tag-list" v-if="item.tags?.length">
              <span v-for="tag in item.tags" :key="tag.id">#{{ tag.name }}</span>
            </div>
            <span v-else>-</span>
          </td>
          <td>{{ ['普通', '图文', '视频'][item.type] }}</td>
          <td>
            <span :class="['badge', item.is_top ? 'badge-true' : 'badge-false']">
              {{ item.is_top ? '是' : '否' }}
            </span>
          </td>
          <td>
            <span :class="['badge', item.is_ad ? 'badge-true' : 'badge-false']">
              {{ item.is_ad ? '是' : '否' }}
            </span>
          </td>
          <td>{{ item.comment_count }}/{{ item.like_count }}</td>
          <td>{{ item.created_at }}</td>
          <td>
            <button @click="openEditModal(item)" class="edit-btn">编辑</button>
            <button @click="handleDelete(item.id.toString())" class="delete-btn">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- 分页和页面大小选择 -->
  <div class="pagination-wrapper">
    <div class="pagination-info">
      <span>共 {{ pagination.total }} 条记录</span>
      <select v-model="pagination.pageSize" @change="handlePageSizeChange(pagination.pageSize)" class="page-size-select">
        <option value="5">5条/页</option>
        <option value="10">10条/页</option>
        <option value="20">20条/页</option>
        <option value="50">50条/页</option>
      </select>
    </div>
    
    <div class="pagination" v-if="totalPages > 1">
      <button 
        :disabled="pagination.page <= 1"
        @click="handlePageChange(pagination.page - 1)"
        class="pagination-btn"
      >
        上一页
      </button>
      
      <template v-for="(page, index) in getVisiblePages()" :key="index">
        <span v-if="page === '...'" class="pagination-ellipsis">...</span>
        <button 
          v-else
          :class="['pagination-btn', { 'active': page === pagination.page }]"
          @click="handlePageChange(page as number)"
        >
          {{ page }}
        </button>
      </template>
      
      <button 
        :disabled="pagination.page >= totalPages"
        @click="handlePageChange(pagination.page + 1)"
        class="pagination-btn"
      >
        下一页
      </button>
    </div>
  </div>
</div>

  <!-- 编辑文章模态框 -->
  <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>编辑文章</h3>
        <button @click="closeEditModal" class="modal-close">×</button>
      </div>
      
      <div class="modal-body">
        <div class="edit-form">
          <div class="form-group full-width">
            <label>文章内容</label>
            <textarea 
              v-model="editForm.content" 
              placeholder="请输入文章内容..."
              rows="6"
            ></textarea>
          </div>
          
	          <div class="form-group full-width">
	            <label>位置信息</label>
            <input 
              type="text" 
              v-model="editForm.location"
              placeholder="输入位置信息"
	            />
	          </div>

	          <div class="form-group full-width">
	            <label>文章标签</label>
	            <input
	              type="text"
	              v-model="tagData"
	              placeholder="输入标签，空格或逗号分隔，最多5个"
	            />
	          </div>

	          <div class="form-row">
            <div class="form-group">
              <label>文章类型</label>
              <select v-model="editForm.type">
                <option :value="0">文本文章</option>
                <option :value="1">图片文章</option>
                <option :value="2">视频文章</option>
              </select>
            </div>
            <div class="form-group">
              <label>文章设置</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="editForm.isTop">
                  置顶文章
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="editForm.isAd">
                  推广内容
                </label>
              </div>
            </div>
          </div>
          
          <div class="form-group full-width" v-if="editForm.type === 1">
            <label>图片链接</label>
            <textarea 
              v-model="imageData" 
              placeholder="输入图片链接，一行一个链接"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group full-width" v-if="editForm.type === 2">
            <label>视频链接</label>
            <textarea 
              v-model="videoData" 
              placeholder="输入视频链接，一行一个链接"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>
      
      <div class="modal-actions">
        <button @click="closeEditModal" class="modal-cancel-btn">取消</button>
        <button @click="handleEdit" :disabled="editStates.saving" class="modal-save-btn">
          {{ editStates.saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>
  </div>

  <!-- 确认对话框 -->
  <div v-if="showConfirmDialog" class="confirm-overlay" @click="closeConfirmDialog">
    <div class="confirm-dialog" @click.stop>
      <div class="confirm-header">
        <h3>{{ confirmData.title }}</h3>
      </div>
      
      <div class="confirm-body">
        <div class="confirm-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V14M12 17.5H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p>{{ confirmData.message }}</p>
      </div>
      
      <div class="confirm-actions">
        <button type="button" @click="closeConfirmDialog" class="confirm-cancel-btn">取消</button>
        <button type="button" @click="confirmData.onConfirm" class="confirm-ok-btn">确定</button>
      </div>
    </div>
  </div>

</template>

<style scoped>
.top,
.list,
.pagination-wrapper,
.modal-container,
.confirm-dialog {
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

form {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 14px;
  align-items: end;
  margin: 0;
}

label,
.form-group label,
.info-item label {
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

form > button,
.edit-btn,
.delete-btn,
.pagination-btn,
.modal-actions button,
.confirm-actions button {
  border: 0;
  border-radius: 0;
  font: inherit;
  font-weight: 850;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, opacity 0.18s ease;
}

form > button {
  min-height: 42px;
  padding: 0 18px;
  color: #fff;
  background: #172033;
  box-shadow: 0 16px 34px rgba(23, 32, 51, 0.16);
}

form > button[type='button'] {
  color: #2c3b55;
  background: #edf5ff;
  box-shadow: none;
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

.avatar-cell,
.user-cell,
.user-info {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.avatar-cell :deep(img),
.user-cell :deep(img),
.user-info :deep(img) {
  width: 38px;
  height: 38px;
  border-radius: 0;
  object-fit: cover;
  box-shadow: 0 8px 20px rgba(53, 82, 125, 0.12);
}

.user-cell i {
  color: #172033;
  font-style: normal;
  font-weight: 850;
}

.username-cell,
.nickname-cell,
.email-cell {
  font-weight: 750;
}

.email-cell,
.time-cell,
.content-cell,
.brief-cell {
  color: #526176;
}

.brief-content,
.comment-content {
  max-width: 360px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.55;
}

.role-badge,
.status-badge,
.badge,
.parent-comment,
.root-comment,
.tag-list span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 0;
  font-size: 12px;
  font-weight: 900;
  white-space: nowrap;
}

.role-1,
.status-1,
.badge-true,
.root-comment {
  color: #23704a;
  background: rgba(88, 198, 135, 0.14);
}

.role-0,
.status-0,
.badge-false,
.parent-comment {
  color: #526176;
  background: rgba(114, 128, 151, 0.12);
}

.status-2 {
  color: #b54d5a;
  background: rgba(236, 111, 125, 0.14);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 220px;
}

.tag-list span {
  color: #3d75c4;
  background: rgba(94, 156, 244, 0.13);
}

.edit-btn,
.delete-btn {
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

.modal-overlay,
.confirm-overlay {
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
  width: min(760px, 100%);
  max-height: min(86vh, 900px);
  overflow: hidden;
}

.confirm-dialog {
  width: min(420px, 100%);
  overflow: hidden;
}

.modal-header,
.confirm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-bottom: 1px solid rgba(96, 114, 142, 0.12);
}

.modal-header h3,
.confirm-header h3 {
  margin: 0;
  color: #172033;
  font-size: 20px;
  letter-spacing: -0.04em;
}

.modal-close {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 0;
  color: #728097;
  font-size: 24px;
  line-height: 1;
  background: #f1f6fb;
  cursor: pointer;
}

.modal-body {
  overflow-y: auto;
  padding: 22px;
}

/* 编辑弹窗跟随配置页的轻表单风格：白底、左侧标签、下划线输入 */
.modal-container {
  width: min(720px, 100%);
  border-radius: 0;
  background: var(--color-bg-app);
  box-shadow: var(--color-shadow);
  backdrop-filter: none;
}

.modal-header {
  padding: 18px 24px 12px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  color: var(--color-text-primary);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: normal;
}

.modal-close {
  width: 30px;
  height: 30px;
  border-radius: 0;
  color: #787878;
  background: var(--color-ad);
}

.modal-close:hover {
  color: var(--color-text-primary);
  background: var(--color-ad-hover);
}

.modal-body {
  padding: 18px 28px 8px;
}

.edit-form {
  display: grid;
  gap: 16px;
}

.form-row,
.info-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.modal-container .edit-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-container .form-row {
  display: contents;
}

.modal-container .form-group,
.modal-container .info-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.modal-container .form-group > label,
.modal-container .info-item > label {
  width: 100px;
  flex: 0 0 100px;
  padding: 7px 0;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
}

.modal-container input,
.modal-container select,
.modal-container textarea {
  flex: 1;
  width: auto;
  max-width: 500px;
  padding: 7px 4px;
  border: 0;
  border-bottom: 1px solid #9ac3ef;
  border-radius: 0;
  color: var(--color-text-primary);
  background: transparent;
  box-shadow: none;
}

.modal-container textarea {
  min-height: 96px;
}

.modal-container input:focus,
.modal-container select:focus,
.modal-container textarea:focus {
  border-color: #6cadf1;
  border-bottom-width: 2px;
  background: transparent;
  box-shadow: none;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.checkbox-label,
.modal-container .checkbox-group .checkbox-label {
  display: inline-flex;
  grid-template-columns: none;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: auto;
  flex: 0 0 auto;
  padding: 10px 12px;
  border-radius: 0;
  background: #f5f9fd;
  white-space: nowrap;
}

.checkbox-label input,
.modal-container .checkbox-label input {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  max-width: none;
  margin: 0;
  padding: 0;
  border: 1px solid #9ac3ef;
}

.comment-info {
  padding: 16px;
  border: 1px solid rgba(96, 114, 142, 0.12);
  border-radius: 0;
  background: #f8fbff;
}

.info-item span {
  color: #172033;
  font-weight: 850;
}

.char-count {
  margin-top: 6px;
  color: #8a96a8;
  font-size: 12px;
  text-align: right;
}

.modal-actions,
.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 22px;
  border-top: 1px solid rgba(96, 114, 142, 0.12);
}

.modal-cancel-btn,
.confirm-cancel-btn {
  min-height: 40px;
  padding: 0 16px;
  color: #2c3b55;
  background: #edf5ff;
}

.modal-save-btn,
.confirm-ok-btn {
  min-height: 40px;
  padding: 0 18px;
  color: #fff;
  background: #172033;
}

.modal-actions {
  padding: 14px 28px 22px;
  border-top: 0;
}

.modal-actions button {
  min-height: 34px;
  border-radius: 0;
  padding: 0 16px;
  font-size: 13px;
}

.modal-cancel-btn {
  color: #787878;
  background: var(--color-ad);
}

.modal-save-btn {
  color: #ffffff;
  background: #09C362;
}

.modal-save-btn:hover:not(:disabled) {
  background: #f8bc99;
}

.confirm-body {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 26px 24px 12px;
  color: #526176;
  text-align: center;
  line-height: 1.7;
}

.confirm-icon {
  display: grid;
  place-items: center;
  width: 70px;
  height: 70px;
  border-radius: 0;
  background: rgba(244, 184, 96, 0.14);
}

.confirm-body p {
  margin: 0;
}

@media (max-width: 900px) {
  form {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  .pagination-wrapper {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 620px) {
  .top,
  .pagination-wrapper,
  .modal-header,
  .modal-body,
  .modal-actions,
  .confirm-header,
  .confirm-actions {
    padding: 16px;
  }

  .top,
  .list,
  .pagination-wrapper,
  .modal-container,
  .confirm-dialog {
    border-radius: 0;
  }

  form,
  .form-row,
  .info-row {
    grid-template-columns: 1fr;
  }

  .modal-overlay,
  .confirm-overlay {
    padding: 12px;
  }
}
</style>
