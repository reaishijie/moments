<script setup lang="ts" name="ArticleActions">
import { showTime, showDetailTime } from '@/utils/time';
import { ref, toRefs, computed } from 'vue';
import { HeartRegular, Heart, CommentAltRegular } from '@vicons/fa'
import { Icon } from '@vicons/utils'

const props = defineProps({
    article: {
        type: Object,
        required: true
    }
});

const { created_at, isLiked} = toRefs(props.article)
const isDetailTime = ref(false)
const isPopupOpen = ref(false)
function togglePopup() {
    isPopupOpen.value = !isPopupOpen.value
}
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
</script>

<template>
    <div class="timeAndAction">
        <!-- 使用 article.created_at 来访问传递进来的数据 -->
        <p @click="isDetailTime = !isDetailTime">{{ isDetailTime ?showDetailTime(createdAtTimestamp) : showTime(createdAtTimestamp) }}</p>
        <div class="action-wrapper" @click="togglePopup">
            <div class="dots-button">
                <p></p>
                <p></p>
            </div>
            <div v-if="isPopupOpen" class="popup">
                <div class="popup-item like" @click="handelLike">
                    <Icon v-if="!isLiked">
                        <HeartRegular />
                    </Icon>
                    <Icon color="rgb(255,100,100)" v-else="isLiked">
                        <Heart />
                    </Icon>
                    <span>{{ article.isLiked ? '取消喜欢' : '喜欢' }}</span>
                </div>
                <div class="popup-divider"></div>
                <div class="popup-item comment" @click.stop="handelComment" @click="isPopupOpen = !isPopupOpen">
                    <Icon >
                        <CommentAltRegular />
                    </Icon>
                    <span>评论</span>
                </div>
            </div>
        </div>
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
.action-wrapper {
    position: relative;
}
.dots-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 4px;
    width: 30px;
    height: 20px;
    background-color: #f0f2f5;
    border-radius: 4px;
    cursor: pointer;
}
.dots-button:hover {
    background-color: #e5e7eb;
}
.dots-button p {
    width: 4px;
    height: 4px;
    background-color: #6b7280;
    border-radius: 50%;
    margin: 0;
}

/** 弹窗css popup > like、divider、commnet */
.popup {
    position: absolute;
    right: calc(100% + 8px); 
    top: 50%;
    transform: translateY(-50%);
    background-color: #4c4c4c;
    display: flex;
    background-color: #4c4c4c;
    color: white;
    font-size: 14px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10; /* 确保弹窗在最上层 */
    white-space: nowrap; /* 防止文字换行 */
}
.popup :hover {
    background-color: #606060;
    border-radius: 6px;
}
.popup-divider {
    width: 1px;
    background-color: #6a6a6a;
    align-self: stretch; /* 让分隔线自动拉伸到父容器高度 */
    margin: 4px 0;
}
.popup-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    cursor: pointer;
}
</style>