<script setup lang="ts" name="Review">
import { nextTick, ref, type PropType } from 'vue';
import AvatarImage from '@/components/utils/AvatarImage.vue';
import EmojiPicker from '@/components/emoji/EmojiPicker.vue';
import EmojiText from '@/components/emoji/EmojiText.vue';
import { HeartRegular, AngleDown } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import { useMessageStore } from '@/store/message'
import { type articleData } from '@/types/article';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import router from '@/router';

const messageStore = useMessageStore()

// 接口
interface Liker {
  id: string;
  displayName: string;
  username:string;
  avatar: string
}
interface Comment {
  id: string,
  user_id: string
  content: string,
  parent_id: string,
  parent_displayName:string,
  user: {
    id: string,
    nickname: string,
    username: string,
    avatar: string
  }
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
const activeReplyId = ref<string | null>(null)
const replyContent = ref('')
const activeTextarea = ref<HTMLTextAreaElement | null>(null)
// 切换评论框的显示
const toggleReply = (commentId: string) => {
  if(activeReplyId.value === commentId) {
    // 如果点击的是当前已打开的评论 -> 关闭
    activeReplyId.value = null
  } else {
    // 赋值并清空输入框内容
    activeReplyId.value = commentId
    replyContent.value = ''
  }
}

const setActiveTextarea = (event: FocusEvent) => {
  activeTextarea.value = event.target as HTMLTextAreaElement
}

const insertEmoji = async (code: string) => {
  const textarea = activeTextarea.value
  if (!textarea) {
    replyContent.value += code
    return
  }

  const start = textarea.selectionStart ?? replyContent.value.length
  const end = textarea.selectionEnd ?? start
  replyContent.value = `${replyContent.value.slice(0, start)}${code}${replyContent.value.slice(end)}`

  await nextTick()
  textarea.focus()
  const cursor = start + code.length
  textarea.setSelectionRange(cursor, cursor)
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

// 发送函数
const handleSendReply = () => {
  if (!replyContent.value.trim()) {
        messageStore.show('评论内容不能为空', 'info', 2000)
    return
  }

  // 通过 emit 将parent_id 和 content 传给父组件处理
  emit('send-reply', {
    articleId: props.article.id,
    parentId: activeReplyId.value,
    content: replyContent.value
  })

  // 发送后进行处理
  replyContent.value = ''
  activeReplyId.value = null
}

const route = useRoute()
const isDetailPage = computed(() => route.name === 'articleDetail')
const likeSummaryText = computed(() => {
  const names = props.likers.map(liker => liker.displayName).join('、')
  const prefix = names ? `${names}...共` : ''
  return `${prefix}${props.article.like_count}人喜欢`
})
const hasReviewContent = computed(() => (
  props.article.like_count !== 0 ||
  props.isShowInput ||
  props.comments.length > 0 ||
  props.hasMore
))
</script>

<template>
  <div class="container" v-if="hasReviewContent">
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
      <textarea v-model="replyContent" placeholder="写下你的评论..." @focus="setActiveTextarea" @input="adjustHeight"></textarea>
      <div class="input-actions">
        <EmojiPicker @select="insertEmoji" />
        <button @click="handleSendReply">发送</button>
      </div>
    </div>

    <div class="comments-container" v-if="comments.length > 0 || hasMore">
      <div class="comment" v-for="comment in comments" :key="comment.id" >

        <div @click="toggleReply(comment.id)">
        <span  class="comment-displayName">{{ comment.user.nickname || comment.user.username }}</span>
        <span v-if="comment.parent_id"> 回复</span>
        <span v-if="comment.parent_id" class="comment-displayName">{{ comment.parent_displayName }}</span>
        <span>：</span>
        <EmojiText :text="comment.content" />
        </div>

        <div class="input" v-if="activeReplyId === comment.id">
          <textarea v-model="replyContent" :placeholder="`回复${(comment.user.nickname || comment.user.username)}`" @focus="setActiveTextarea" @input="adjustHeight"></textarea>
          <div class="input-actions">
            <EmojiPicker @select="insertEmoji" />
            <button @click="handleSendReply">发送</button>
          </div>
        </div>

      </div>
      <span class="load-more" v-if="hasMore" @click="loadMore">
        <div>
        {{ remainingComments }}条回复
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
.comments-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 4px 0 0 5px;
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
