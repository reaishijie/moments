<script setup lang="ts" name="AArticle">
import { ref, computed } from 'vue'
import type { articleFilter, articleData, updateArticleData } from '@/types/article';
import { getArticle, updateArticle, deleteArticle } from '@/api/articles';
import { useMessageStore } from '@/store/message';

const initialArticleData = {
  articleId: '',
  userId: '',
  content: '',
  location: '',
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
  
  showEditModal.value = true
}

// 关闭编辑弹窗
const closeEditModal = () => {
  showEditModal.value = false
  editingArticle.value = null
  editForm.value = {}
  imageData.value = ''
  videoData.value = ''
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
              <img :src="item.user.avatar" alt="" />
              <i>@{{ item.user.username }}</i>
            </div>
          </td>
          <td>{{ item.content.slice(0, 50) }}{{ item.content.length > 50 ? '...' : '' }}</td>
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
.top {
  background: #FFFFFF;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 8px skyblue;
}
form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
  margin-bottom: 20px;
}

label {
  display: flex;
  align-items: center;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  flex: 0 0 auto;
  min-width: 0;
}

input,
select {
  margin-left: 8px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  min-width: 120px;
  max-width: 200px;
}

input:focus,
select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 8px skyblue;
}

button {
  outline: none;
  border: none;
  background: #09C362;
  border-radius: 5px;
  width: 80px;
  padding: 5px;
  margin-top: 10px;
  color: #ffffff;
  font-size: small;
  cursor: pointer;
}

button:hover, .badge-true:hover {
  background: #F8BC99;
}


.list {
  background: #ffffff;
  padding: 20px;
  box-shadow: 0 0 8px skyblue;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;  /* 横向滚动 */
  -webkit-overflow-scrolling: touch; /* iOS 流畅滚动 */
}

table {
  min-width: 800px;
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 8px 12px;
  border: 1px solid #ddd;
  text-align: left;
  color: #5a5b5c;
  white-space: nowrap;
}

td {
  font-size: medium;
}

tbody tr:nth-child(even) {
  background: #f9f9f9;
}

.user-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.user-cell img {
  width: 30px;
  height: 30px;
  border-radius: 20px;
  margin-bottom: 4px;
}
.user-cell i {
  font-size: xx-small;
  color: #888;
}

td button {
  width: auto;
  margin: 0 2px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  padding: 4px 8px;
}

.edit-btn {
  background: #09C362;
  color: #fff;
  border: none;
}

.edit-btn:hover {
  background: #07a854;
}

.delete-btn {
  background: #F44336;
  color: #fff;
  border: none;
}

.delete-btn:hover, .badge-false:hover {
  background: #f44336aa;
}
/* badge.css */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  text-align: center;
  white-space: nowrap; /* 避免换行 */
}

/* 状态颜色 */
.badge-true {
  background-color: #09C362;
}

.badge-false {
  background-color: #F44336;
}

/* 移动端响应式优化 */
@media (max-width: 768px) {
  .top {
    padding: 15px;
  }
  
  form {
    gap: 10px;
    justify-content: center;
  }
  
  label {
    flex-direction: column;
    align-items: flex-start;
    text-align: center;
    width: 100%;
    max-width: 200px;
  }
  
  input,
  select {
    margin-left: 0;
    margin-top: 5px;
    width: 100%;
    min-width: auto;
    max-width: none;
  }
  
  button {
    width: 100%;
    max-width: 120px;
    margin: 5px;
  }
  
  .list {
    padding: 15px;
    margin: 0 -15px;
  }
  
  .table-wrapper {
    margin: 0 -15px;
    padding: 0 15px;
  }
  
  table {
    min-width: 900px;
    font-size: 12px;
  }
  
  th,
  td {
    padding: 6px 8px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  label {
    max-width: none;
  }
  
  form {
    flex-direction: column;
    align-items: stretch;
  }
  
  table {
    min-width: 800px;
  }
  
  .user-cell img {
    width: 25px;
    height: 25px;
  }
  
  td button {
    padding: 4px 6px;
    font-size: 10px;
  }
}

/* 分页组件样式 */
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #ffffff;
  box-shadow: 0 0 8px skyblue;
  margin-top: 20px;
  border-radius: 8px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.pagination-info span {
  color: #666;
  font-size: 14px;
}

.page-size-select {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  background: #fff;
}

.page-size-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 4px rgba(0, 123, 255, 0.25);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-btn {
  padding: 6px 10px;
  border: 1px solid #ddd;
  background: #fff;
  color: #333;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  min-width: 36px;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
  color: #007bff;
}

.pagination-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  background: #f8f9fa;
}

.pagination-btn.active {
  background: #007bff;
  border-color: #007bff;
  color: #fff;
}

.pagination-ellipsis {
  display: flex;
  align-items: center;
  gap: 2px;
}

.pagination-ellipsis span {
  padding: 6px 2px;
  color: #999;
  font-size: 13px;
}

/* 移动端分页样式优化 */
@media (max-width: 768px) {
  .pagination-wrapper {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }
  
  .pagination {
    flex-wrap: nowrap;
    justify-content: center;
    gap: 3px;
    overflow-x: auto;
    padding: 5px 0;
  }
  
  .pagination-btn {
    padding: 6px 8px;
    font-size: 12px;
    min-width: 32px;
    flex-shrink: 0;
  }
}

@media (max-width: 480px) {
  .pagination-info {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .pagination {
    gap: 2px;
    padding: 5px;
  }
  
  .pagination-btn {
    padding: 4px 6px;
    font-size: 11px;
    min-width: 28px;
  }
  
  .pagination-ellipsis span {
    padding: 4px 2px;
    font-size: 11px;
  }
}

/* 编辑模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1002;
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: auto;
  margin: 0;
  line-height: 1;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  width: 100%;
}

.form-group label {
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0 !important;
  font-weight: normal !important;
  font-size: 14px !important;
  cursor: pointer;
  padding: 4px 0;
}

.checkbox-label input[type="checkbox"] {
  width: 16px !important;
  height: 16px !important;
  margin: 0 !important;
  cursor: pointer;
  accent-color: #2196F3;
}

.checkbox-label span {
  color: #333;
  user-select: none;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #e5e5e5;
}

.modal-cancel-btn,
.modal-save-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  width: auto;
  margin: 0;
}

.modal-cancel-btn {
  background: white;
  color: #666;
  border-color: #ddd;
}

.modal-cancel-btn:hover {
  background: #f8f9fa;
  border-color: #999;
}

.modal-save-btn {
  background: #2196F3;
  color: white;
  border-color: #2196F3;
}

.modal-save-btn:hover:not(:disabled) {
  background: #1976D2;
  border-color: #1976D2;
}

.modal-save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 移动端模态框优化 */
@media (max-width: 768px) {
  .modal-container {
    width: 95%;
    max-height: 90vh;
    margin: 20px 10px;
  }
  
  .modal-header {
    padding: 16px 20px;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .modal-actions {
    flex-direction: column;
    padding: 16px 20px;
  }
  
  .modal-cancel-btn,
  .modal-save-btn {
    width: 100%;
  }
  
  .modal-save-btn {
    order: -1;
    margin-bottom: 8px;
  }
}

/* 确认对话框样式 */
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  animation: fadeIn 0.2s ease-out;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

.confirm-header {
  padding: 24px 24px 16px 24px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.confirm-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.confirm-body {
  padding: 24px;
  text-align: center;
}

.confirm-icon {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

.confirm-body p {
  margin: 0;
  color: #666;
  font-size: 15px;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  padding: 16px 24px 24px 24px;
  gap: 12px;
  justify-content: flex-end;
}

.confirm-cancel-btn,
.confirm-ok-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  min-width: 80px;
}

.confirm-cancel-btn {
  background: white;
  color: #666;
  border-color: #d9d9d9;
}

.confirm-cancel-btn:hover {
  color: #333;
  border-color: #b3b3b3;
  background: #fafafa;
}

.confirm-ok-btn {
  background: #ff4d4f;
  color: white;
  border-color: #ff4d4f;
}

.confirm-ok-btn:hover {
  background: #ff7875;
  border-color: #ff7875;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端确认框优化 */
@media (max-width: 768px) {
  .confirm-dialog {
    width: 95%;
    margin: 20px;
  }
  
  .confirm-actions {
    flex-direction: column;
  }
  
  .confirm-cancel-btn,
  .confirm-ok-btn {
    width: 100%;
    margin-bottom: 8px;
  }
  
  .confirm-ok-btn {
    order: -1;
  }
}
</style>