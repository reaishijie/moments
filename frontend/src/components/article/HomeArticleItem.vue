<script setup lang="ts" name="HomeArticleItem">
import { type PropType } from 'vue'
import { type articleData } from '@/types/article';
import { formatTime } from '@/utils/time';

const props = defineProps({
  article: {
    type: Object as PropType<articleData>,
    required: true
  }
})
const timestamp = new Date(props.article.created_at).getTime()
const time = formatTime(timestamp)

</script>

<template>
  <div class="article-item">
    <div class="time">
      <div class="day">{{  time.data }}</div>
      <div class="divider">/</div>
      <div class="month">{{ time.month }}月</div>
    </div>
    <div class="content">
      <div class="media" v-if="props.article.article_images && props.article.article_images.length > 0">
        <!-- 展示第一张图片， 后面设计其他 -->
        <div class="image">
          <img :src="props.article.article_images[0].image_url" alt="image1">
        </div>
      </div>
      <div class="text">{{ article.content }}</div>
    </div>
  </div>
</template>

<style scoped>
/* 每篇文章样式 */
.article-item {
  width: 100%;
  display: flex;
  flex-direction: row;
  padding: 16px;
  box-sizing: border-box;
  border-bottom: 1px solid #f0f2f5;
}
.time {
  display: flex;
  align-items: center;
  width: 60px;
  margin-right: 20px;
  gap: 8px;
}
.day {
  font-size: 24px;
  line-height: 1;
}
.month {
  font-size: 13px;
  color: #7e6565;
}
.image {
  display: flex;
  width: 80px;
}
.image img {
  width: 100%;
}
.content {
  display: flex;
  flex-direction: row;
  gap: 8px;
  font-size: small;
}
</style>