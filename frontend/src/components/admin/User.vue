<script setup lang="ts" name="AUser">
import AvatarImage from '@/components/utils/AvatarImage.vue'
import { useAdminUserList } from '@/composables/useAdminUserList'

const {
  userFilter,
  users,
  togglingStatusIds,
  pagination,
  totalPages,
  resetForm,
  handleSearch,
  handlePageChange,
  handlePageSizeChange,
  getVisiblePages,
  showConfirmDialog,
  confirmData,
  closeConfirmDialog,
  handleDelete,
  getStatusText,
  getRoleText,
  getNextStatus,
  toggleUserStatus,
  editingUser,
  showEditModal,
  editForm,
  editStates,
  openEditModal,
  closeEditModal,
  saveUserChanges,
  showNoticeModal,
  noticeTarget,
  noticeForm,
  noticeSending,
  openNoticeModal,
  closeNoticeModal,
  submitNotice,
} = useAdminUserList()
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
                <AvatarImage :src="item.avatar" alt="头像" />
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
              <button
                type="button"
                class="status-badge toggle-badge"
                :class="'status-' + item.status"
                :disabled="togglingStatusIds.has(item.id)"
                :title="`点击切换为：${getStatusText(getNextStatus(item.status))}`"
                @click="toggleUserStatus(item)"
              >
                {{ getStatusText(item.status) }}
              </button>
            </td>
            <td class="time-cell">{{ new Date(item.created_at).toLocaleDateString() }}</td>
            <td>
              <button @click="openEditModal(item)" class="edit-btn">编辑</button>
              <button @click="openNoticeModal(item)" class="notice-btn">通知</button>
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
              <span class="readonly-value">{{ editingUser?.username }}</span>
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
            <div class="form-group">
              <label>封禁至</label>
              <input type="datetime-local" v-model="editForm.banned_until" placeholder="留空表示永久或清除">
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

  <!-- 发送通知模态框 -->
  <div v-if="showNoticeModal" class="modal-overlay" @click="closeNoticeModal">
    <div class="modal-container" @click.stop>
      <div class="modal-header">
        <h3>发送系统通知</h3>
        <button @click="closeNoticeModal" class="modal-close">×</button>
      </div>

      <div class="modal-body">
        <div class="edit-form">
          <div class="form-group">
            <label>接收用户</label>
            <span class="readonly-value">{{ noticeTarget?.nickname || noticeTarget?.username }}（ID: {{ noticeTarget?.id }}）</span>
          </div>
          <div class="form-group">
            <label>标题</label>
            <input type="text" v-model="noticeForm.title" placeholder="通知标题">
          </div>
          <div class="form-group full-width">
            <label>内容</label>
            <textarea v-model="noticeForm.content" placeholder="通知内容" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>跳转链接</label>
            <input type="text" v-model="noticeForm.link" placeholder="可选，例如 /notifications">
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="closeNoticeModal" class="modal-cancel-btn">取消</button>
        <button @click="submitNotice" :disabled="noticeSending" class="modal-save-btn">
          {{ noticeSending ? '发送中...' : '发送' }}
        </button>
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
.notice-btn,
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
  line-clamp: 2;
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
.notice-btn,
.delete-btn {
  min-height: 34px;
  padding: 0 12px;
  margin: 3px;
}

.edit-btn {
  color: #245fae;
  background: rgba(94, 156, 244, 0.13);
}

.notice-btn {
  color: #23704a;
  background: rgba(88, 198, 135, 0.14);
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

.readonly-value {
  flex: 1;
  max-width: 500px;
  padding: 7px 4px;
  border-bottom: 1px solid var(--color-border);
  color: #787878;
  line-height: 1.4;
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

.checkbox-label {
  display: inline-flex;
  grid-template-columns: none;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 0;
  background: #f5f9fd;
}

.checkbox-label input {
  width: auto;
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
