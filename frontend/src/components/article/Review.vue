<script setup lang="ts" name="Review">
import { ref, type PropType } from 'vue';
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
</script>

<template>
  <div class="container">
    <div class="users" v-if="article.like_count !== 0">
      <Icon class="users-icon">
        <HeartRegular />
      </Icon>
      <span v-for="(liker, index) in likers" :key="index">
        <span  v-if="!isDetailPage">{{ liker.displayName }}</span>
        <img  v-if="isDetailPage" :src="liker.avatar" alt="" style="width: 25px; height: 25px;" @click="router.push(`/home/${liker.username}`)"/>
      <span v-if="index < likers.length - 1">，</span>
      </span>
      <span v-if="likers.length !== 0">...共</span>
      <span v-if="article.like_count !== 0">{{ article.like_count }}人喜欢</span>
    </div>

    <div class="input" v-if="props.isShowInput">
      <textarea v-model="replyContent" placeholder="写下你的评论..." @input="adjustHeight"></textarea>
      <button @click="handleSendReply">发送</button>
    </div>

    <div class="comments-container">
      <div class="comment" v-for="comment in comments" :key="comment.id" >

        <div @click="toggleReply(comment.id)">
        <span  class="comment-displayName">{{ comment.user.nickname || comment.user.username }}</span>
        <span v-if="comment.parent_id"> 回复</span>
        <span v-if="comment.parent_id" class="comment-displayName">{{ comment.parent_displayName }}</span>
        <span>：</span>
        <span>{{ comment.content }}</span>
        </div>

        <div class="input" v-if="activeReplyId === comment.id">
          <textarea v-model="replyContent" :placeholder="`回复${(comment.user.nickname || comment.user.username)}`" @input="adjustHeight"></textarea>
          <button @click="handleSendReply">发送</button>
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
  background-color: #f7f7f7;
  flex-direction: column;
}

.users {
  padding: 5px 5px 5px 10px;
  color: #9ac3ef;
  border-bottom: 1px solid #dae4f28d;

}

.users-icon {
  margin-right: 6px;
}

.input {
  display: flex;
  flex-direction: column;
  width: 90%;
  margin: 10px auto;
  background: #fff;
  border-radius: 5px;
  overflow: hidden;
}

textarea {
  border: none;
  resize: none;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  min-height: 40px;
  height: 50px;
  max-height: 100px;
  overflow: hidden;
  overflow-y: auto;
}

.input:focus-within {
  border: 2px solid #f8a778;
}

textarea:focus {
  outline: none;
}

button {
  align-self: flex-end;
  margin: 10px;
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
}
.comment-displayName {
  padding: 5px 5px 5px 10px;
  color: #9ac3ef;
}

.load-more {
color: #25252574;
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
