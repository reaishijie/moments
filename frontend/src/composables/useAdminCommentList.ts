import { ref, computed } from 'vue'
import type { Comment } from '@/types/comments';
import { getAllComment as getAdminComments, updateComment } from '@/api/admin';
import { deleteComment } from '@/api/comments';
import { useMessageStore } from '@/store/message';

/**
 * 后台评论管理页的全部状态与请求逻辑。
 *
 * 从 admin/Comment.vue 抽出：筛选、分页、对话框与数据操作。
 * 组件只负责模板渲染与事件转发。
 */
export function useAdminCommentList() {
  const messageStore = useMessageStore()

  const initialCommentFilter = {
    commentId: '',
    userId: '',
    articleId: '',
    parentId: '',
    content: '',
  }

  const commentFilter = ref({ ...initialCommentFilter })
  const comments = ref<Comment[]>([])
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0
  })

  const resetForm = () => {
    commentFilter.value = { ...initialCommentFilter }
    pagination.value.page = 1
    handleSearch()
  }

  const handleSearch = async () => {
    const params: any = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }
    if (commentFilter.value.commentId) params.commentId = Number(commentFilter.value.commentId)
    if (commentFilter.value.userId) params.userId = Number(commentFilter.value.userId)
    if (commentFilter.value.articleId) params.articleId = Number(commentFilter.value.articleId)
    if (commentFilter.value.parentId) params.parentId = Number(commentFilter.value.parentId)
    if (commentFilter.value.content) params.content = commentFilter.value.content
  
    try {
      const res = await getAdminComments(params)
      comments.value = res.data.data || []
      pagination.value = {
        page: res.data.page || 1,
        pageSize: res.data.pageSize || 10,
        total: res.data.total || 0
      }
    } catch (error) {
      console.error('获取评论失败:', error)
      messageStore.show('获取评论失败', 'error', 3000)
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

  // 编辑评论相关状态
  const editingComment = ref<Comment | null>(null)
  const showEditModal = ref(false)
  const editForm = ref({ content: '' })
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

  // 删除评论
  const handleDelete = async (commentId: string) => {
    showConfirm(
      '确认删除',
      '确定要删除这条评论吗？此操作不可恢复！',
      async () => {
        const loadingId = messageStore.show('正在删除评论...', 'loading')
        try {
          await deleteComment(commentId)
          messageStore.update(loadingId, { text: '评论删除成功！', type: 'success', duration: 2000 })
          handleSearch()
          closeConfirmDialog()
        } catch (error) {
          console.error('删除评论失败:', error)
          messageStore.update(loadingId, { text: '删除失败，请稍后重试', type: 'error', duration: 3000 })
        }
      }
    )
  }

  // 编辑评论功能
  const openEditModal = (comment: Comment) => {
    editingComment.value = { ...comment }
    editForm.value = { content: comment.content }
    showEditModal.value = true
  }

  const closeEditModal = () => {
    showEditModal.value = false
    editingComment.value = null
    editForm.value = { content: '' }
    editStates.value.saving = false
  }

  const saveCommentChanges = async () => {
    if (!editingComment.value || !editForm.value.content.trim()) return
  
    editStates.value.saving = true
    const loadingId = messageStore.show('正在保存评论...', 'loading')
  
    try {
      await updateComment(editingComment.value.id, { content: editForm.value.content.trim() })
      messageStore.update(loadingId, { text: '评论更新成功！', type: 'success', duration: 2000 })
      closeEditModal()
      handleSearch() // 刷新列表
    } catch (error) {
      console.error('更新评论失败:', error)
      messageStore.update(loadingId, { text: '更新失败，请稍后重试', type: 'error', duration: 3000 })
    } finally {
      editStates.value.saving = false
    }
  }

  // 进入页面即加载数据
  handleSearch()

  return {
    commentFilter,
    comments,
    pagination,
    resetForm,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    totalPages,
    editingComment,
    showEditModal,
    editForm,
    editStates,
    getVisiblePages,
    showConfirmDialog,
    confirmData,
    closeConfirmDialog,
    handleDelete,
    openEditModal,
    closeEditModal,
    saveCommentChanges,
  }
}
