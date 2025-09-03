<script setup lang="ts" name="ArticleActions">
import { showTime, showDetailTime } from '@/utils/time';
import { ref, toRefs, computed } from 'vue';
import { HeartRegular, Heart, CommentAltRegular } from '@vicons/fa'
import ActionPopup from '@/components/ActionPopup.vue'

const props = defineProps({
    article: {
        type: Object,
        required: true
    }
});

const { created_at } = toRefs(props.article)
const isDetailTime = ref(false)

// 传递事件给父组件
const emit = defineEmits(['like', 'comment'])
function handelLike() {
    emit('like')
}
function handelComment() {
    emit('comment')
}

const createdAtTimestamp = computed(() => {
  // 增加一个检查，防止 created_at 无效时页面崩溃
  const date = new Date(created_at.value);
  return isNaN(date.getTime()) ? 0 : date.getTime();
});

// 定义弹出菜单的操作项
const actionItems = computed(() => [
  {
    id: 'like',
    label: props.article.isLiked ? '取消喜欢' : '喜欢',
    icon: props.article.isLiked ? Heart : HeartRegular,
    iconColor: props.article.isLiked ? 'rgb(255,100,100)' : undefined,
    onClick: handelLike
  },
  {
    id: 'comment',
    label: '评论',
    icon: CommentAltRegular,
    onClick: handelComment
  }
]);
</script>

<template>
    <div class="timeAndAction">
        <!-- 使用 article.created_at 来访问传递进来的数据 -->
        <p @click="isDetailTime = !isDetailTime">{{ isDetailTime ?showDetailTime(createdAtTimestamp) : showTime(createdAtTimestamp) }}</p>
        <ActionPopup :actions="actionItems" />
    </div>
</template>

<style scoped>
.timeAndAction {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.timeAndAction p {
    margin: 0;
    font-size: 12px;
    color: #B2B2B2;
}
</style>