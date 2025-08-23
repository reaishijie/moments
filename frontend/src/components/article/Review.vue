<script setup lang="ts" name="Review">
import { ref, onMounted } from 'vue'
import { HeartRegular } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import { usersOfLikeArticle } from '@/api/articles'
import { getCommentsByArticleId } from '@/api/comments'
import CommentNode from './CommentNode.vue'

const props = defineProps({
  article: {
    type: Object,
    required: true
  },
  isShowInput: {
    type: Boolean,
    required: true
  }
})

interface User {
  id: string;
  displayName: string;
  avatar: string;
}

const names = ref<string[]>([])
const showDisplayName = async (articleId: number) => {
  const res = await usersOfLikeArticle(articleId)
  const userData: User[] = res.data
  names.value = userData.map(user => user.displayName)
}

interface RawComment {
  id: string;
  content: string;
  parent_id: string | null;
  user: {
    nickname?: string;
    username: string;
    avatar: string;
  };
  replies?: RawComment[];
}

interface CommentItem {
  id: string;
  content: string;
  parent_id: string | null;
  displayName: string;
  avatar: string;
  replies?: CommentItem[];
}

interface CommentResponse {
  data: RawComment[];
  page: number;
  pageSize: number;
  total: number;
}

const comments = ref<CommentItem[]>([])

const transformComment = (raw: RawComment): CommentItem => ({
  id: raw.id,
  content: raw.content,
  parent_id: raw.parent_id,
  displayName: raw.user.nickname || raw.user.username,
  avatar: raw.user.avatar,
  replies: raw.replies?.map(transformComment) || []
})

const showComments = async (articleId: number) => {
  const res = await getCommentsByArticleId(articleId, { page: 1, pageSize: 3 })
  const commentRes: CommentResponse = res.data
  comments.value = commentRes.data.map(transformComment)
  console.log('@@@', comments.value);
  
}

onMounted(async () => {
  await showDisplayName(props.article.id)
  await showComments(props.article.id)
})

const adjustHeight = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}
</script>

<template>
  <div class="container">
    <div class="users">
      <Icon v-if="article.like_count !== 0" class="users-icon">
        <HeartRegular />
      </Icon>
      <span v-for="(displayName, index) in names" :key="index">
        {{ displayName }}<span v-if="index < names.length - 1">,</span>
      </span>
      <span v-if="names.length !== 0">...共</span>
      <span v-if="article.like_count !== 0">{{ article.like_count }}人喜欢</span>
    </div>

    <div class="input" v-if="isShowInput">
      <textarea placeholder="写下你的评论..." @input="adjustHeight"></textarea>
      <button @click="">发送</button>
    </div>

    <div class="comments">
      <CommentNode
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
      />
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
  padding: 10px 5px 0px 10px;
  color: #9ac3ef;
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
</style>
