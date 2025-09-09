<script setup lang="ts" name="ArticleItem">
import ArticleActions from './ArticleActions.vue';
import Review from './Review.vue';
import { getLocation } from '@/utils/location'
import { Thumbtack, Ad } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import router from '@/router';
import { type articleData } from '@/types/article';
import { useMessageStore } from '@/store/message';
import Media from './Media.vue';

const messageStore = useMessageStore()
const props = defineProps<{
    article: articleData,
    likers: any[], // 点赞人列表
    comments: any[], // 评论列表
    isShowInput: boolean, //评论框显示状态
    hasMoreComments: boolean,
    remainingComments: number,
    isLoadingComments: boolean,
}>();

const emit = defineEmits(['like', 'comment', 'send-reply', 'load-more-comments']);

async function showLocation() {
    try {
        const promiseResult = await getLocation()
        const data = promiseResult?.result
        console.log(data);
    } catch (error) {
        console.log('@error', error)
    }
}
</script>

<template>
    <div class="article-item" v-if="props.article">
        <!-- 左侧头像 -->
        <div class="article-avatar" @click="router.push(`/home/${props.article.user.username}`)">
            <img :src="props.article.user?.avatar" alt="avatar">
        </div>
        <!-- 内容 -->
        <div class="article-context">
            <!-- 用户昵称 -->
            <div class="nickname">
                <div @click="router.push(`/home/${props.article.user.username}`)">
                    <p>{{ props.article.user?.nickname || props.article.user.username }}</p>
                </div>
                <div class="tags">
                    <div class="tag-item" v-if="props.article.is_top"
                        @click="messageStore.show('该内容为置顶内容', 'info', 2000)">
                        <Icon class="tag-icon">
                            <Thumbtack />
                        </Icon>
                        <span>置顶</span>
                    </div>
                    <div class="tag-item" v-if="props.article.is_ad"
                        @click="messageStore.show('该内容为广告内容', 'info', 2000)">
                        <Icon class="tag-icon">
                            <Ad />
                        </Icon>
                        <span>广告</span>
                    </div>
                </div>
            </div>
            <!-- 文章内容 -->
            <div v-if="article.content" class="main-context" @click="router.push(`/article/${props.article.id}`)">
                <p>{{ props.article.content }}</p>
            </div>
            <div class="media">
                <!-- 将article传递给组件 -->
                <Media :article="props.article" />
            </div>
            <div class="location" @click="showLocation">
                <p>{{ props.article.location }}</p>
            </div>
            <!-- 时间、点赞评论按钮 -->
            <ArticleActions :article="props.article" @like="emit('like', props.article.id)"
                @comment="emit('comment')" />
            <!-- 评论 -->
            <div class="review">
                <Review :article="props.article" :likers="props.likers" :comments="props.comments"
                    :is-show-input="props.isShowInput" :has-more="props.hasMoreComments"
                    :is-loading="props.isLoadingComments" :remaining-comments="props.remainingComments"
                    :load-more="() => emit('load-more-comments')"
                    @send-reply="(payload) => emit('send-reply', payload)" />
            </div>
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

.article-item:first-child {
    border-top: none;
}

.article-item:last-child {
    border-bottom: none;
}

/* 左侧头像区域 */
.article-avatar {
    width: 50px;
    height: 50px;
    flex-shrink: 0;
    margin-right: 15px;
}

.article-avatar:hover {
    cursor: pointer;
}

.article-avatar img {
    width: 100%;
    height: 100%;
    border-radius: 5%;
    object-fit: cover;
}

/* 用户名、文章内容、评论 */
.article-context {
    flex: 1;
    /**撑满剩余区域 */
    display: flex;
    flex-direction: column;
    min-width: 0;
}

/**昵称样式 */
.nickname {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
}

.nickname div:hover {
    cursor: pointer;
}

.nickname p {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #586C97;
}

/* 置顶和广告样式 */
.tags {
    display: flex;
    gap: 8px;
}

.tag-item {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #909399;
    background-color: #f0f2f5;
    padding: 2px 6px;
    border-radius: 4px;
}

.tag-icon {
    margin-right: 4px;
    font-size: 12px;
    /* Set icon size */
    color: #909399;
    /* Set icon color */
}

/** 文章内容样式 */
.main-context p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: #1A1A1A;
    word-wrap: break-word;
    /* 处理长单词或链接换行 */
    word-break: break-all;
    /* 处理长单词或链接换行 */
}

.location {
    color: #4E6086;
    font-size: 12px;
}

.location p {
    margin: 2px 0 2px 0;
    padding: 0;
}

.main-context {
    margin-top: 8px;
    margin-bottom: 5px;
}

.review {
    display: flex;
    flex-direction: row;
    font-size: 13px;
    color: #6b7280;
}
</style>