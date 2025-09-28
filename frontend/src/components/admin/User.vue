<script setup lang="ts" name="AUser">
import { ref, computed } from 'vue'
import type { userData, updateUserData } from '@/types/user';
import { getAllUsers, deleteUser, updateUser } from '@/api/admin';
import { useMessageStore } from '@/store/message';

const messageStore = useMessageStore()

const initialUserFilter = {
  userId: '',
  username: '',
  email: '',
  nickname: '',
  status: '',
  role: '',
}

const userFilter = ref({ ...initialUserFilter })
const users = ref<userData[]>([])
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

const resetForm = () => {
  userFilter.value = { ...initialUserFilter }
  pagination.value.page = 1
  handleSearch()
}

const handleSearch = async () => {
  const params: any = {
    page: pagination.value.page,
    pageSize: pagination.value.pageSize
  }
  if (userFilter.value.userId) params.userId = Number(userFilter.value.userId)
  if (userFilter.value.username) params.username = userFilter.value.username
  if (userFilter.value.email) params.email = userFilter.value.email
  if (userFilter.value.nickname) params.nickname = userFilter.value.nickname
  if (userFilter.value.status) params.status = Number(userFilter.value.status)
  if (userFilter.value.role) params.role = Number(userFilter.value.role)
  
  try {
    const res = await getAllUsers(params)
    users.value = res.data.data || []
    pagination.value = {
      page: res.data.page || 1,
      pageSize: res.data.pageSize || 10,
      total: res.data.total || 0
    }
  } catch (error) {
    console.error('获取用户失败:', error)
    messageStore.show('获取用户失败', 'error', 3000)
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

// 编辑用户相关状态
const editingUser = ref<userData | null>(null)
const showEditModal = ref(false)
const editForm = ref<updateUserData>({})
const editStates = ref({
  saving: false
})

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

// 删除用户
const handleDelete = async (userId: string) => {
  showConfirm(
    '确认删除',
    '确定要删除这个用户吗？此操作不可恢复！',
    async () => {
      const loadingId = messageStore.show('正在删除用户...', 'loading')
      try {
        await deleteUser(userId)
        messageStore.update(loadingId, { text: '用户删除成功！', type: 'success', duration: 2000 })
        handleSearch()
        closeConfirmDialog()
      } catch (error) {
        console.error('删除用户失败:', error)
        messageStore.update(loadingId, { text: '删除失败，请稍后重试', type: 'error', duration: 3000 })
      }
    }
  )
}

// 获取用户状态显示文本
const getStatusText = (status: string | number) => {
  const statusStr = String(status)
  switch (statusStr) {
    case '0': return '未激活'
    case '1': return '正常'
    case '2': return '封禁'
    default: return '未知'
  }
}

// 获取用户角色显示文本
const getRoleText = (role: string | number) => {
  const roleStr = String(role)
  switch (roleStr) {
    case '0': return '普通用户'
    case '1': return '管理员'
    default: return '未知'
  }
}

// 编辑用户功能
const openEditModal = (user: userData) => {
  editingUser.value = { ...user }
  editForm.value = {
    username: user.username,
    email: user.email,
    nickname: user.nickname,
    brief: user.brief,
    status: Number(user.status),
    role: Number(user.role),
    avatar: user.avatar,
    header_background: user.header_background
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editingUser.value = null
  editForm.value = {}
  editStates.value.saving = false
}

const saveUserChanges = async () => {
  if (!editingUser.value) return
  
  editStates.value.saving = true
  const loadingId = messageStore.show('正在保存用户信息...', 'loading')
  
  try {
    await updateUser(editingUser.value.id, editForm.value)
    messageStore.update(loadingId, { text: '用户信息更新成功！', type: 'success', duration: 2000 })
    closeEditModal()
    handleSearch() // 刷新列表
  } catch (error) {
    console.error('更新用户信息失败:', error)
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
      <label for="user_id" title="用户ID">用户ID：
        <input type="number" id="user_id" placeholder="用户ID" v-model="userFilter.userId">
      </label>
      <label for="username" title="用户名">用户名：
        <input type="text" id="username" placeholder="用户名(支持模糊查询)" v-model="userFilter.username">
      </label>
      <label for="email" title="用户邮箱">用户邮箱：
        <input type="text" id="email" placeholder="用户邮箱(支持模糊查询)" v-model="userFilter.email">
      </label>
      <label for="nickname" title="用户昵称">用户昵称：
        <input type="text" id="nickname" placeholder="用户昵称(支持模糊查询)" v-model="userFilter.nickname">
      </label>
      <label for="status" title="用户状态">用户状态：
        <select id="status" v-model="userFilter.status">
          <option value="">全部状态</option>
          <option value="0">未激活</option>
          <option value="1">正常</option>
          <option value="2">封禁</option>
        </select>
      </label>
      <label for="role" title="用户角色">用户角色：
        <select id="role" v-model="userFilter.role">
          <option value="">全部角色</option>
          <option value="0">普通用户</option>
          <option value="1">管理员</option>
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
            <th>用户头像</th>
            <th>用户名</th>
            <th>昵称</th>
            <th>邮箱</th>
            <th>简介</th>
            <th>角色</th>
            <th>状态</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in users" :key="item.id">
            <td>{{ item.id }}</td>
            <td>
              <div class="avatar-cell">
                <img :src="item.avatar || '/default-avatar.png'" alt="头像" />
              </div>
            </td>
            <td class="username-cell">{{ item.username }}</td>
            <td class="nickname-cell">{{ item.nickname || '-' }}</td>
            <td class="email-cell">{{ item.email }}</td>
            <td class="brief-cell">
              <div class="brief-content">
                {{ item.brief || '-' }}
              </div>
            </td>
            <td>
              <span class="role-badge" :class="'role-' + item.role">
                {{ getRoleText(item.role) }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="'status-' + item.status">
                {{ getStatusText(item.status) }}
              </span>
            </td>
            <td class="time-cell">{{ new Date(item.created_at).toLocaleDateString() }}</td>
            <td>
              <button @click="openEditModal(item)" class="edit-btn">编辑</button>
              <button @click="handleDelete(item.id)" class="delete-btn">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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

  <!-- 编辑用户模态框 -->
  <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>编辑用户信息</h3>
        <button @click="closeEditModal" class="modal-close">×</button>
      </div>
      
      <div class="modal-body">
        <div class="edit-form">
          <div class="form-row">
            <div class="form-group">
              <label>用户名</label>
              <input type="text" v-model="editForm.username" placeholder="用户名">
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input type="email" v-model="editForm.email" placeholder="邮箱地址">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>昵称</label>
              <input type="text" v-model="editForm.nickname" placeholder="用户昵称">
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model="editForm.status">
                <option :value="0">未激活</option>
                <option :value="1">正常</option>
                <option :value="2">封禁</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>角色</label>
              <select v-model="editForm.role">
                <option :value="0">普通用户</option>
                <option :value="1">管理员</option>
              </select>
            </div>
          </div>
          
          <div class="form-group full-width">
            <label>个人简介</label>
            <textarea v-model="editForm.brief" placeholder="个人简介" rows="3"></textarea>
          </div>
          
          <div class="form-group full-width">
            <label>头像链接</label>
            <input type="url" v-model="editForm.avatar" placeholder="头像图片链接">
          </div>
          
          <div class="form-group full-width">
            <label>背景图片链接</label>
            <input type="url" v-model="editForm.header_background" placeholder="背景图片链接">
          </div>
        </div>
      </div>
      
      <div class="modal-actions">
        <button @click="closeEditModal" class="modal-cancel-btn">取消</button>
        <button @click="saveUserChanges" :disabled="editStates.saving" class="modal-save-btn">
          {{ editStates.saving ? '保存中...' : '保存' }}
        </button>
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

button:hover {
  background: #F8BC99;
}

.list {
  background: #ffffff;
  padding: 20px;
  box-shadow: 0 0 8px skyblue;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

table {
  min-width: 1200px;
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

.avatar-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-cell img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.username-cell {
  font-weight: 500;
  color: #333;
}

.nickname-cell,
.email-cell {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brief-cell {
  max-width: 200px;
}

.brief-content {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-badge,
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-0 {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.role-1 {
  background: #fff3e0;
  color: #f57c00;
  border: 1px solid #ffcc02;
}

.status-0 {
  background: #fafafa;
  color: #757575;
  border: 1px solid #e0e0e0;
}

.status-1 {
  background: #e8f5e8;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.status-2 {
  background: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.time-cell {
  font-size: 12px;
  color: #888;
}

.edit-btn {
  background: #2196F3;
  color: #fff;
  border: none;
  padding: 4px 8px;
  width: auto;
  margin: 0 4px 0 0;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn:hover {
  background: #1976D2;
}

.delete-btn {
  background: #F44336;
  color: #fff;
  border: none;
  padding: 4px 8px;
  width: auto;
  margin: 0;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn:hover {
  background: #f44336aa;
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
    min-width: 1200px;
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
    min-width: 1000px;
  }
  
  .avatar-cell img {
    width: 30px;
    height: 30px;
  }
  
  .delete-btn {
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
  max-width: 600px;
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

@media (max-width: 480px) {
  .edit-btn,
  .delete-btn {
    padding: 4px 6px;
    font-size: 10px;
    margin: 2px;
  }
}
</style>