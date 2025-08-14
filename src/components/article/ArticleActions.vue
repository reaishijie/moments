<script setup lang="ts" name="ArticleActions">
import { showTime, showDetailTime } from '@/utils/time';
import { ref } from 'vue';
const {article} = defineProps({
    article: {
        type: Object,
        required: true
    }
});
const isDetailTime = ref(false)
const isPopupOpen = ref(false)
function togglePopup() {
    isPopupOpen.value = !isPopupOpen.value
}
function handelLike() {
    console.log('like被调用了', article.id)
    article.isLiked = !article.isLiked
}
function handelComment() {
    console.log('comment被调用了', article.id)
}
</script>

<template>
    <div class="timeAndAction">
        <!-- 使用 props.article.createdAt 来访问传递进来的数据 -->
        <p @click="isDetailTime = !isDetailTime">{{ isDetailTime ?showDetailTime(+ article.createdAt) : showTime(+ article.createdAt) }}</p>
        <!-- <p>{{ showDetailTime(+props.article.createdAt) }}</p> -->
        <div class="action-wrapper" @click="togglePopup">
            <div class="dots-button">
                <p></p>
                <p></p>
            </div>
            <div v-if="isPopupOpen" class="popup">
                <div class="popup-item like" @click="handelLike">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" :fill="article.isLiked ? 'red' : 'none'" :stroke="article.isLiked ? 'red' : 'white'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>{{ article.isLiked ? '取消喜欢' : '喜欢' }}</span>
                </div>
                <div class="popup-divider"></div>
                <div class="popup-item comment" @click="handelComment">
                    <!-- 补全了评论图标的 SVG -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
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