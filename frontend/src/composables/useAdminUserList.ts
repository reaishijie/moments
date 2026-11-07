import { ref, computed } from 'vue'
import type { userData, updateUserData } from '@/types/user';
import { getAllUsers, deleteUser, updateUser, sendSystemNotice } from '@/api/admin';
import { useMessageStore } from '@/store/message';

/**
 * 后台用户管理页的全部状态与请求逻辑。
 *
 * 从 admin/User.vue 抽出：筛选、分页、状态切换、编辑、通知发送与确认弹窗。
 * 组件只负责模板渲染与事件转发。
 */
export function useAdminUserList() {

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
  const togglingStatusIds = ref<Set<string>>(new Set())
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

  const toDatetimeLocal = (value?: string | null) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return offsetDate.toISOString().slice(0, 16)
  }

  const fromDatetimeLocal = (value?: string | null) => value ? new Date(value).toISOString() : null

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

  const getNextStatus = (status: string | number) => {
    const current = Number(status)
    if (current === 0) return 1
    if (current === 1) return 2
    return 0
  }

  const toggleUserStatus = async (user: userData) => {
    if (togglingStatusIds.value.has(user.id)) return

    const nextStatus = getNextStatus(user.status)
    togglingStatusIds.value.add(user.id)
    const loadingId = messageStore.show(`正在切换用户状态为「${getStatusText(nextStatus)}」...`, 'loading')

    try {
      await updateUser(user.id, { status: nextStatus })
      user.status = String(nextStatus)
      messageStore.update(loadingId, { text: '用户状态切换成功！', type: 'success', duration: 2000 })
    } catch (error) {
      console.error('切换用户状态失败:', error)
      messageStore.update(loadingId, { text: '切换失败，请稍后重试', type: 'error', duration: 3000 })
    } finally {
      togglingStatusIds.value.delete(user.id)
    }
  }

  // 编辑用户功能
  const openEditModal = (user: userData) => {
    editingUser.value = { ...user }
    editForm.value = {
      email: user.email,
      nickname: user.nickname,
      brief: user.brief,
      status: Number(user.status),
      role: Number(user.role),
      avatar: user.avatar,
      header_background: user.header_background,
      banned_until: toDatetimeLocal(user.banned_until)
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
      await updateUser(editingUser.value.id, {
        ...editForm.value,
        banned_until: fromDatetimeLocal(editForm.value.banned_until),
      })
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

  const showNoticeModal = ref(false)
  const noticeTarget = ref<userData | null>(null)
  const noticeForm = ref({ title: '', content: '', link: '' })
  const noticeSending = ref(false)

  const openNoticeModal = (user: userData) => {
    noticeTarget.value = user
    noticeForm.value = { title: '', content: '', link: '' }
    showNoticeModal.value = true
  }

  const closeNoticeModal = () => {
    showNoticeModal.value = false
    noticeTarget.value = null
    noticeSending.value = false
  }

  const submitNotice = async () => {
    if (!noticeTarget.value) return
    if (!noticeForm.value.title.trim() || !noticeForm.value.content.trim()) {
      messageStore.show('标题和内容不能为空', 'info', 2500)
      return
    }

    noticeSending.value = true
    const loadingId = messageStore.show('正在发送通知...', 'loading')
    try {
      await sendSystemNotice({
        to: noticeTarget.value.id,
        title: noticeForm.value.title.trim(),
        content: noticeForm.value.content.trim(),
        link: noticeForm.value.link.trim() || undefined,
      })
      messageStore.update(loadingId, { text: '通知发送成功！', type: 'success', duration: 2000 })
      closeNoticeModal()
    } catch (error) {
      console.error('发送通知失败:', error)
      messageStore.update(loadingId, { text: '发送失败，请稍后重试', type: 'error', duration: 3000 })
    } finally {
      noticeSending.value = false
    }
  }

  // 进入页面即加载第一页
  handleSearch()

  return {
    closeConfirmDialog,
    closeEditModal,
    closeNoticeModal,
    confirmData,
    editForm,
    editStates,
    editingUser,
    getNextStatus,
    getRoleText,
    getStatusText,
    getVisiblePages,
    handleDelete,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    noticeForm,
    noticeSending,
    noticeTarget,
    openEditModal,
    openNoticeModal,
    pagination,
    resetForm,
    saveUserChanges,
    showConfirmDialog,
    showEditModal,
    showNoticeModal,
    submitNotice,
    toggleUserStatus,
    togglingStatusIds,
    totalPages,
    userFilter,
    users,
  }
}
