<script setup lang="ts" name="MessageList">
import { useMessageStore } from '@/store/message'
import { CheckCircleRegular, TimesCircleRegular, InfoCircle, Spinner } from '@vicons/fa'
import { Icon } from '@vicons/utils'
const messageStore = useMessageStore()
</script>

<template>
    <div class="message-wrapper">
        <transition-group name="fade" tag="div">
            <div v-for="msg in messageStore.messages" :key="msg.id" :class="['message', msg.type]" @click="messageStore.close(msg.id)">
                <Icon class="icon" size="14px">
                    <CheckCircleRegular v-if="msg.type === 'success'" />
                    <TimesCircleRegular v-if="msg.type === 'error'" />
                    <InfoCircle v-if="msg.type === 'info'" />
                    <Spinner v-if="msg.type === 'loading'" />
                </Icon>
                {{ msg.text }}
            </div>
        </transition-group>
    </div>
</template>

<style scoped>
.message-wrapper {
    position: fixed;
    right: 0px;
    bottom: 20vh;
    /* 距底部 0.2 视口高度 */
    display: flex;
    flex-direction: column-reverse;
    /* 新消息在下方 */
    align-items: flex-end;
    z-index: 9999;
}

.message {
    display: flex; /* 使用 flexbox */
    align-items: center; /* 垂直居中对齐 */
    padding: 10px 16px;
    margin: 10px 0;
    border-radius: 4px;
    color: #fff;
    min-width: 125px;
    max-width: 240px;
    min-height: auto;
    text-align: start;
    font-size: 14px;
}

.icon {
    margin-right: 6px;
    /* 图标与文本之间的间距 */
    vertical-align: middle;
    /* 使图标与文本垂直对齐 */
}

.success {
    background: linear-gradient(90deg, rgba(58, 162, 54, 0.8), rgba(89, 247, 131, 0.8));
}

.error {
    background: linear-gradient(90deg, rgba(253, 69, 28, 0.7), rgba(251, 110, 75, 0.8));
}

.info {
    background: linear-gradient(90deg, rgba(15, 147, 249, 0.7), rgba(61, 189, 249, 0.8));
}

.loading {
    background: linear-gradient(90deg, rgba(253, 170, 71, 0.7), rgba(247, 154, 13, 0.8));
}
.loading .icon {
    animation: rotate 1s linear infinite; /* 360°旋转，1秒，线性，无限循环 */
}

@keyframes rotate {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.35s ease;
}

.fade-enter-from {
    opacity: 0;
    transform: translateX(100%);
}

.fade-leave-to {
    opacity: 0;
    transform: translateX(100%);
}
</style>
