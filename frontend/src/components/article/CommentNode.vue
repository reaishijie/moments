<script setup lang="ts">
import type { PropType } from 'vue'

interface CommentItem {
  id: string;
  content: string;
  parent_id: string | null;
  displayName: string;
  avatar: string;
  replies?: CommentItem[];
}

defineProps({
  comment: {
    type: Object as PropType<CommentItem>,
    required: true
  },
  parentName: {
    type: String,
    required: false
  }
})
</script>

<template>
  <div class="comment-node">
    <div class="content">
      <strong>{{ comment.displayName }}</strong>
      <span v-if="parentName"> 回复 <strong>{{ parentName }}</strong></span>
      ：{{ comment.content }}
    </div>

    <div class="replies" v-if="comment.replies?.length">
      <CommentNode
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :parentName="comment.displayName"
      />
    </div>
  </div>
</template>

<style scoped>
.comment-node {
  margin-left: 10px;
  margin-top: 8px;
}
.content {
  font-size: 14px;
  color: #333;
}
.replies {
  margin-left: 20px;
  border-left: 1px solid #ddd;
  padding-left: 10px;
}
</style>
