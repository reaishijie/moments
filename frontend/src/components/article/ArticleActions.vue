<script setup lang="ts" name="ArticleActions">
import { ref } from 'vue';
import { HeartRegular, Heart, CommentAltRegular } from '@vicons/fa'
import { Icon } from '@vicons/utils'

defineProps({
    article: {
        type: Object,
        required: true
    },
    compact: {
        type: Boolean,
        default: false
    }
});

const isPopupOpen = ref(false)
function togglePopup() {
    isPopupOpen.value = !isPopupOpen.value
}
// 传递事件给父组件
const emit = defineEmits(['like', 'comment'])
</script>

<template>
    <div :class="['tagAndAction', { compact }]">
        <div class="tag-slot" v-if="!compact">
            <slot></slot>
        </div>
        <div class="action-wrapper" @click="togglePopup">
            <div class="dots-button">
                <p></p>
                <p></p>
            </div>
            <div v-if="isPopupOpen" class="popup">
                <div class="popup-item like" @click="emit('like')">
                    <Icon v-if="!article.isLiked">
                        <HeartRegular />
                    </Icon>
                    <Icon color="rgb(255,100,100)" v-else="article.isLiked">
                        <Heart />
                    </Icon>
                    <span>{{ article.isLiked ? '取消喜欢' : '喜欢' }}</span>
                </div>
                <div class="popup-divider"></div>
                <div class="popup-item comment" @click.stop="emit('comment')" @click="isPopupOpen = !isPopupOpen">
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
.tagAndAction {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 20px;
}
.tagAndAction.compact {
    min-height: 0;
}
.tag-slot {
    display: flex;
    flex: 1;
    min-width: 0;
}
.action-wrapper {
    position: relative;
    flex-shrink: 0;
}
.dots-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 4px;
    width: 30px;
    height: 20px;
    background-color: var(--color-ad);
    border-radius: 4px;
    cursor: pointer;
}
.dots-button:hover {
    background-color: var(--color-ad-hover);
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
