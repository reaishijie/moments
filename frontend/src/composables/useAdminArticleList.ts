import { ref, computed } from 'vue'
import type { articleFilter, articleData, updateArticleData } from '@/types/article';
import { getArticle, updateArticle, deleteArticle } from '@/api/articles';
import { useMessageStore } from '@/store/message';

/**
 * 后台文章管理页的全部状态与请求逻辑。
 *
 * 从 admin/Article.vue 抽出：筛选、分页、对话框与数据操作。
 * 组件只负责模板渲染与事件转发。
 */
export function useAdminArticleList() {
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
  const togglingArticleKeys = ref<Set<string>>(new Set())
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

  const toggleArticleFlag = async (item: articleData, field: 'isTop' | 'isAd') => {
    const dataKey = field === 'isTop' ? 'is_top' : 'is_ad'
    const label = field === 'isTop' ? '置顶' : '广告'
    const toggleKey = `${item.id}-${field}`

    if (togglingArticleKeys.value.has(toggleKey)) return

    const nextValue = !item[dataKey]
    togglingArticleKeys.value.add(toggleKey)
    const loadingId = messageStore.show(`正在${nextValue ? '开启' : '关闭'}${label}...`, 'loading')

    try {
      await updateArticle(item.id, { [field]: nextValue })
      item[dataKey] = nextValue
      messageStore.update(loadingId, { text: `${label}状态切换成功！`, type: 'success', duration: 2000 })
    } catch (error) {
      console.error(`切换文章${label}失败:`, error)
      messageStore.update(loadingId, { text: '切换失败，请稍后重试', type: 'error', duration: 3000 })
    } finally {
      togglingArticleKeys.value.delete(toggleKey)
    }
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

  // 进入页面即加载数据
  handleSearch()

  return {
    article,
    articles,
    togglingArticleKeys,
    pagination,
    resetForm,
    handleSearch,
    handlePageChange,
    handlePageSizeChange,
    totalPages,
    getVisiblePages,
    showEditModal,
    editForm,
    imageData,
    videoData,
    tagData,
    editStates,
    showConfirmDialog,
    confirmData,
    closeConfirmDialog,
    handleDelete,
    toggleArticleFlag,
    openEditModal,
    closeEditModal,
    handleEdit,
  }
}
