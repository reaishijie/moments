<script setup lang="ts" name="Review">
import { nextTick, ref, watch, type PropType } from 'vue';
import AvatarImage from '@/components/utils/AvatarImage.vue';
import EmojiPicker from '@/components/emoji/EmojiPicker.vue';
import EmojiText from '@/components/emoji/EmojiText.vue';
import { HeartRegular, AngleDown, CommentRegular } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import { useMessageStore } from '@/store/message'
import { type articleData } from '@/types/article';
import type { Comment } from '@/types/comments';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import router from '@/router';
import Captcha from '@/components/captcha/Captcha.vue';
import { useDefaultStore } from '@/store/default';

const messageStore = useMessageStore()
const defaultStore = useDefaultStore()
const needCaptcha = computed(() => defaultStore.configs.user_captcha_comment === '1')
const captchaProof = ref<string>()
const captchaRef = ref<InstanceType<typeof Captcha> | null>(null)
const onCaptchaVerified = (data: { status: boolean, message: string, captchaProof?: string }) => {
  captchaProof.value = data.captchaProof
}

// 接口
interface Liker {
  id: string;
  displayName: string;
  username:string;
  avatar: string
}
const props = defineProps({
  article: {
    type: Object as PropType<articleData>,
    required: true
  },
  isShowInput: Boolean,
  hasMore: {
    type: Boolean,
    required: true
  },
  remainingComments : {
    type: Number,
    required: true
  },
  isLoading: {
    type: Boolean,
    required: true
  },
  likers: {
    // 期望收到一个 Liker 对象的数组
    type: Array as PropType<Liker[]>,
    default: () => []
  },
  comments: {
    type: Array as PropType<Comment[]>,
    default: () => []
  },
  loadMore:{
    type: Function as PropType<() => void>,
    required: true
  }
})

const adjustHeight = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}

const emit = defineEmits(['send-reply'])
const reviewRoot = ref<HTMLElement | null>(null)
const activeReplyId = ref<string | null>(null)
const articleContent = ref('')
const replyContent = ref('')
const activeTextarea = ref<HTMLTextAreaElement | null>(null)
const activeComposer = ref<'article' | 'reply'>('article')
const activeTextareaComposer = ref<'article' | 'reply'>('article')

// 切换评论框的显示
const toggleReply = async (commentId: string) => {
  if(activeReplyId.value === commentId) {
    activeReplyId.value = null
    return
  }

  activeReplyId.value = commentId
  replyContent.value = ''
  activeComposer.value = 'reply'
  activeTextarea.value = null

  await nextTick()
  const textarea = reviewRoot.value?.querySelector<HTMLTextAreaElement>(`textarea[data-reply-input="${commentId}"]`)
  if (textarea) {
    textarea.focus()
    activeTextarea.value = textarea
    activeTextareaComposer.value = 'reply'
  }
}

const setActiveTextarea = (event: FocusEvent, composer: 'article' | 'reply') => {
  activeTextarea.value = event.target as HTMLTextAreaElement
  activeComposer.value = composer
  activeTextareaComposer.value = composer
}

watch(() => props.isShowInput, async (isShowInput) => {
  if (!isShowInput) return

  activeReplyId.value = null
  activeComposer.value = 'article'
  await nextTick()
  const textarea = reviewRoot.value?.querySelector<HTMLTextAreaElement>('textarea[data-article-input="true"]')
  if (textarea) {
    textarea.focus()
    activeTextarea.value = textarea
    activeTextareaComposer.value = 'article'
  }
})

const getContentByComposer = (composer: 'article' | 'reply') => composer === 'article' ? articleContent : replyContent

const insertEmoji = async (code: string, composer: 'article' | 'reply' = activeComposer.value) => {
  const content = getContentByComposer(composer)
  const textarea = activeTextareaComposer.value === composer ? activeTextarea.value : null
  if (!textarea) {
    content.value += code
    activeComposer.value = composer
    return
  }

  const start = textarea.selectionStart ?? content.value.length
  const end = textarea.selectionEnd ?? start
  content.value = `${content.value.slice(0, start)}${code}${content.value.slice(end)}`

  await nextTick()
  textarea.focus()
  const cursor = start + code.length
  textarea.setSelectionRange(cursor, cursor)
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

// 发送函数
const handleSendReply = (content: string, parentId: string | null = activeReplyId.value) => {
  if (!content.trim()) {
    messageStore.show('评论内容不能为空', 'info', 2000)
    return
  }
  if (needCaptcha.value && !captchaProof.value) {
    messageStore.show('请先完成人机验证', 'info', 2000)
    return
  }

  emit('send-reply', {
    articleId: props.article.id,
    parentId,
    content,
    captchaProof: captchaProof.value,
    onComplete: (success: boolean) => {
      if (success) {
        if (parentId) {
          replyContent.value = ''
          activeReplyId.value = null
        } else {
          articleContent.value = ''
        }
      }
      captchaProof.value = undefined
      captchaRef.value?.reset()
    },
  })
}

const route = useRoute()
const isDetailPage = computed(() => route.name === 'articleDetail')
const likeSummaryText = computed(() => {
  const names = props.likers.map(liker => liker.displayName).join('、')
  const prefix = names ? `${names}...共` : ''
  return `${prefix}${props.article.like_count}人喜欢`
})
const getDisplayName = (comment: Comment) => comment.user.nickname || comment.user.username
const getCommentTime = (comment: Comment) => {
  const date = new Date(comment.created_at)
  if (isNaN(date.getTime())) return ''

  const pad = (value: number) => String(value).padStart(2, '0')
  const now = new Date()
  const year = date.getFullYear()
  const monthDay = `${date.getMonth() + 1}月${date.getDate()}日`
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`

  return year === now.getFullYear()
    ? `${monthDay} ${time}`
    : `${year}年${monthDay} ${time}`
}

const threadedComments = computed<Comment[]>(() => {
  const map = new Map<string, Comment & { replies: Comment[] }>()
  const roots: (Comment & { replies: Comment[] })[] = []

  const ensureComment = (comment: Comment) => {
    const existing = map.get(comment.id)
    if (existing) {
      Object.assign(existing, comment)
      existing.replies = existing.replies || []
      return existing
    }

    const item = { ...comment, replies: [...(comment.replies || [])] }
    map.set(item.id, item)
    return item
  }

  props.comments.forEach(comment => {
    const item = ensureComment(comment)
    if (!item.parent_id) {
      roots.push(item)
    }
  })

  props.comments.forEach(comment => {
    if (!comment.parent_id) return

    const item = ensureComment(comment)
    const parent = map.get(comment.parent_id)
    if (!parent) {
      roots.push(item)
      return
    }

    const root = parent.parent_id ? roots.find(rootComment => (
      rootComment.id === parent.parent_id || rootComment.replies.some(reply => reply.id === parent.id)
    )) : parent

    if (root && root.id !== item.id && !root.replies.some(reply => reply.id === item.id)) {
      root.replies.push(item)
    }
  })

  return roots
})

const HOME_COMMENT_PREVIEW_LIMIT = 5

const visibleThreadedComments = computed<Comment[]>(() => {
  if (isDetailPage.value) return threadedComments.value

  let remaining = HOME_COMMENT_PREVIEW_LIMIT
  const visible: Comment[] = []

  for (const comment of threadedComments.value) {
    if (remaining <= 0) break
    remaining--
    const replies = (comment.replies || []).slice(0, Math.max(remaining, 0))
    remaining -= replies.length
    visible.push({ ...comment, replies })
  }

  return visible
})

const totalVisibleComments = (comments: Comment[]) => comments.reduce((total, comment) => (
  total + 1 + (comment.replies?.length || 0)
), 0)

const hiddenPreviewCount = computed(() => Math.max(
  totalVisibleComments(threadedComments.value) - totalVisibleComments(visibleThreadedComments.value),
  0
))

const handleLoadMore = () => {
  if (!isDetailPage.value && hiddenPreviewCount.value > 0) {
    router.push(`/article/${props.article.id}`)
    return
  }
  props.loadMore()
}

const loadMoreText = computed(() => {
  if (!isDetailPage.value && hiddenPreviewCount.value > 0) {
    return `查看全部评论（还有${hiddenPreviewCount.value}条）`
  }
  return `${props.remainingComments}条评论`
})

const hasReviewContent = computed(() => (
  props.article.like_count !== 0 ||
  props.isShowInput ||
  threadedComments.value.length > 0 ||
  props.hasMore
))
</script>

<template>
  <div class="container" v-if="hasReviewContent" ref="reviewRoot">
    <div class="users" v-if="article.like_count !== 0">
      <Icon class="users-icon">
        <HeartRegular />
      </Icon>
      <div class="users-text">
        <template v-if="isDetailPage">
          <span v-for="(liker, index) in likers" :key="index" class="liker-item">
          <AvatarImage v-if="isDetailPage" :src="liker.avatar" alt="" class="liker-avatar" @click="router.push(`/home/${liker.username}`)" />
          </span>
          <span>{{ article.like_count }}人喜欢</span>
        </template>
        <span v-else class="like-summary">{{ likeSummaryText }}</span>
      </div>
    </div>

    <div class="input" v-if="props.isShowInput">
      <textarea v-model="articleContent" data-article-input="true" placeholder="写下你的评论..." @focus="setActiveTextarea($event, 'article')" @input="adjustHeight"></textarea>
      <div class="input-actions">
        <EmojiPicker placement="bottom" @select="(code) => insertEmoji(code, 'article')" />
        <button @click="handleSendReply(articleContent, null)">发送</button>
      </div>
    </div>

    <div class="captcha-wrap" v-if="needCaptcha && (props.isShowInput || activeReplyId)">
      <Captcha ref="captchaRef" @verified="onCaptchaVerified" />
    </div>

    <div class="comments-container" v-if="threadedComments.length > 0 || hasMore">
      <div class="detail-comments" v-if="isDetailPage">
        <Icon class="comments-icon">
          <CommentRegular />
        </Icon>
        <div class="detail-comments-list">
          <div class="detail-comment-thread" v-for="comment in visibleThreadedComments" :key="comment.id">
            <div class="detail-comment-item" @click="toggleReply(comment.id)">
              <AvatarImage :src="comment.user.avatar" alt="" class="comment-avatar" @click.stop="router.push(`/home/${comment.user.username}`)" />
              <div class="comment-main">
                <div class="comment-meta">
                  <span class="comment-displayName">{{ getDisplayName(comment) }}</span>
                  <span class="comment-time">{{ getCommentTime(comment) }}</span>
                </div>
                <div class="comment-content">
                  <EmojiText :text="comment.content" />
                </div>
              </div>
            </div>

            <div class="input detail-reply-input" v-if="activeReplyId === comment.id">
              <textarea v-model="replyContent" :data-reply-input="comment.id" :placeholder="`回复${getDisplayName(comment)}`" @focus="setActiveTextarea($event, 'reply')" @input="adjustHeight"></textarea>
              <div class="input-actions">
                <EmojiPicker placement="bottom" @select="(code) => insertEmoji(code, 'reply')" />
                <button @click="handleSendReply(replyContent)">发送</button>
              </div>
            </div>

            <div class="detail-replies" v-if="comment.replies?.length">
              <template v-for="reply in comment.replies" :key="reply.id">
                <div class="detail-comment-item detail-reply-item" @click="toggleReply(reply.id)">
                  <AvatarImage :src="reply.user.avatar" alt="" class="comment-avatar" @click.stop="router.push(`/home/${reply.user.username}`)" />
                  <div class="comment-main">
                    <div class="comment-meta">
                      <span>
                        <span class="comment-displayName">{{ getDisplayName(reply) }}</span>
                        <span class="reply-target"> 回复 </span>
                        <span class="comment-displayName">{{ reply.parent_displayName || getDisplayName(comment) }}</span>
                      </span>
                      <span class="comment-time">{{ getCommentTime(reply) }}</span>
                    </div>
                    <div class="comment-content">
                      <EmojiText :text="reply.content" />
                    </div>
                  </div>
                </div>

                <div class="input detail-reply-input" v-show="activeReplyId === reply.id">
                  <textarea v-model="replyContent" :data-reply-input="reply.id" :placeholder="`回复${getDisplayName(reply)}`" @focus="setActiveTextarea($event, 'reply')" @input="adjustHeight"></textarea>
                  <div class="input-actions">
                    <EmojiPicker placement="bottom" @select="(code) => insertEmoji(code, 'reply')" />
                    <button @click="handleSendReply(replyContent)">发送</button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <template v-else>
        <div class="comment-thread" v-for="comment in visibleThreadedComments" :key="comment.id">
          <div class="comment parent-comment" @click="toggleReply(comment.id)">
            <span class="comment-displayName">{{ getDisplayName(comment) }}</span>
            <span>：</span>
            <EmojiText :text="comment.content" />
          </div>

          <div class="input" v-if="activeReplyId === comment.id">
            <textarea v-model="replyContent" :data-reply-input="comment.id" :placeholder="`回复${getDisplayName(comment)}`" @focus="setActiveTextarea($event, 'reply')" @input="adjustHeight"></textarea>
            <div class="input-actions">
              <EmojiPicker placement="bottom" @select="(code) => insertEmoji(code, 'reply')" />
              <button @click="handleSendReply(replyContent)">发送</button>
            </div>
          </div>

          <div class="reply-list" v-if="comment.replies?.length">
            <div class="comment reply-comment" v-for="reply in comment.replies" :key="reply.id" @click="toggleReply(reply.id)">
              <span class="comment-displayName">{{ getDisplayName(reply) }}</span>
              <span> 回复 </span>
              <span class="comment-displayName">{{ reply.parent_displayName || getDisplayName(comment) }}</span>
              <span>：</span>
              <EmojiText :text="reply.content" />
            </div>

            <div class="input reply-input" v-for="reply in comment.replies" :key="`input-${reply.id}`" v-show="activeReplyId === reply.id">
              <textarea v-model="replyContent" :data-reply-input="reply.id" :placeholder="`回复${getDisplayName(reply)}`" @focus="setActiveTextarea($event, 'reply')" @input="adjustHeight"></textarea>
              <div class="input-actions">
                <EmojiPicker placement="bottom" @select="(code) => insertEmoji(code, 'reply')" />
                <button @click="handleSendReply(replyContent)">发送</button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <span class="load-more" v-if="hasMore || hiddenPreviewCount > 0" @click="handleLoadMore">
        <div>
        {{ loadMoreText }}
        <Icon>
          <AngleDown />
        </Icon>
        </div>
      </span>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  margin-top: 5px;
  display: flex;
  background-color: var(--color-bg-outside);
  flex-direction: column;
}

.users {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 4px 8px 4px 10px;
  color: var(--color-text-other);
  border-bottom: 1px solid var(--color-review-border);
  line-height: 18px;
}

.users-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  width: 14px;
  height: 18px;
}

.users-icon :deep(svg) {
  display: block;
}

.users-text {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  min-width: 0;
  font-size: 13px;
  line-height: 18px;
}

.like-summary {
  display: inline-block;
  overflow-wrap: anywhere;
  line-height: 18px;
}

.liker-item {
  display: inline-flex;
  align-items: center;
}

.liker-avatar {
  width: 25px;
  height: 25px;
  margin-right: 5px;
  cursor: pointer;
}

.input {
  display: flex;
  flex-direction: column;
  width: 90%;
  margin: 10px auto;
  background: var(--color-bg-review);
  border-radius: 5px;
  overflow: visible;
}

textarea {
  border: none;
  resize: none;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  min-height: 40px;
  height: 50px;
  max-height: 100px;
  overflow: hidden;
  overflow-y: auto;
  background-color: var(--color-bg-review);
}

.input:focus-within {
  border: 2px solid #f8a778;
}

textarea:focus {
  outline: none;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 10px;
}

button {
  align-self: flex-end;
  margin: 0;
  color: white;
  background: #09C362;
  border-radius: 5px;
  border: none;
  padding: 5px 20px;
}

button:hover {
  background: #f8bc99;
}
.captcha-wrap {
  width: 90%;
  margin: 10px auto;
}

.comments-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 4px 0 0 5px;
}

.comment-thread {
  padding: 2px 8px 4px 5px;
}

.comment {
  line-height: 1.6;
  word-break: break-word;
  cursor: pointer;
}

.reply-list {
  margin: 3px 0 0 12px;
  padding: 3px 6px;
  border-left: 2px solid var(--color-review-border);
  background: rgba(154, 195, 239, 0.06);
}

.reply-comment {
  color: var(--color-text-primary);
}

.reply-input {
  width: 96%;
  margin: 8px auto 4px;
}

.detail-comments {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 4px 8px 4px 5px;
}

.comments-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  width: 14px;
  height: 18px;
  color: var(--color-text-other);
}

.comments-icon :deep(svg) {
  display: block;
}

.detail-comments-list {
  flex: 1;
  min-width: 0;
}

.detail-comment-thread + .detail-comment-thread {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--color-review-border);
}

.detail-comment-item {
  display: flex;
  gap: 8px;
  cursor: pointer;
}

.detail-reply-item {
  margin-top: 8px;
}

.comment-avatar {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 5%;
  object-fit: cover;
  cursor: pointer;
}

.comment-main {
  flex: 1;
  min-width: 0;
}

.comment-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  line-height: 18px;
}

.comment-time {
  flex-shrink: 0;
  color: #888;
  font-size: 12px;
}

.comment-content {
  margin-top: 2px;
  line-height: 1.6;
  word-break: break-word;
  color: var(--color-text-primary);
}

.detail-replies {
  margin: 8px 0 0 36px;
}

.reply-target {
  color: var(--color-text-primary);
}

.detail-reply-input {
  width: calc(100% - 36px);
  margin: 8px 0 0 36px;
}

.comment-displayName {
  color: #9ac3ef;
}

.load-more {
margin-left: 10px;
transition: color 0.3s, font-size 0.3s;
height: 20px;
}
.load-more:hover {
  cursor: pointer;
  color: #bbd7f4;
  font-size: larger;
}
</style>
