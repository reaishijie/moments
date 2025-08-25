<script setup lang="ts" name="Review">
import type { PropType } from 'vue';
import { HeartRegular } from '@vicons/fa';
import { Icon } from '@vicons/utils';

// 接口
interface Liker {
  id: string;
  displayName: string;
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
defineProps({
  article: {
    type: Object,
    required: true
  },
  isShowInput: {
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
  }
})

const adjustHeight = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}
</script>

<template>
  <div class="container">
    <div class="users" v-if="article.like_count !== 0">
      <Icon class="users-icon">
        <HeartRegular />
      </Icon>
      <span v-for="(liker, index) in likers" :key="index">{{ liker.displayName }}<span
          v-if="index < likers.length - 1">，</span>
      </span>
      <span v-if="likers.length !== 0">...共</span>
      <span v-if="article.like_count !== 0">{{ article.like_count }}人喜欢</span>
    </div>

    <div class="input" v-if="isShowInput">
      <textarea placeholder="写下你的评论..." @input="adjustHeight"></textarea>
      <button @click="">发送</button>
    </div>

    <div class="comments">
      <div class="comment" v-for="(comment,index) in comments" :key="index">
        <span v-if="!comment.parent_id" class="comment-displayName">{{ comment.user.nickname }}</span>
        <span v-if="comment.parent_id" class="comment-displayName">{{ comment.user.nickname }}</span>
        <span v-if="comment.parent_id"> 回复</span>
        <span v-if="comment.parent_id" class="comment-displayName">{{ comment.parent_displayName }}</span>
        <span>：</span>
        <span>{{ comment.content }}</span>
      </div>
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

.comment-displayName {
  padding: 5px 5px 5px 10px;
  color: #9ac3ef;
}
</style>
