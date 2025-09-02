<script setup lang="ts" name="ArticleItem">
import ArticleActions from './ArticleActions.vue';
import Review from './Review.vue';
import { getLocation } from '@/utils/location'
import { useFeedStore } from '@/store/feed';
import { ref, onMounted, computed } from 'vue';
import { getArticleLikes } from '@/api/articles';
import { useMessageStore } from '@/store/message';
import { Thumbtack, Ad } from '@vicons/fa';
import { Icon } from '@vicons/utils';

const props = defineProps({
    article: {
        type: Object,
        required: true
    }
})

// 状态管理
const isShowInput = ref(false)
const likers = ref<any[]>([])
const feedStore = useFeedStore()
const messageStore = useMessageStore()

const comments = computed(() => feedStore.commentsMap[props.article.id] ?? [])
const hasMore = computed(() => feedStore.commentPagination[props.article.id]?.hasMore ?? false)
const remainingComments = computed(() => {
    const pagination = feedStore.commentPagination[props.article.id]
    if (!pagination) {
        return 0
    }
    return pagination.total - (pagination.page * pagination.pageSize)
})
const isLoading = computed(() => feedStore.commentPagination[props.article.id]?.isLoading ?? false)

async function showLocation() {
    try {
        const promiseResult = await getLocation()
        const data = promiseResult?.result
        console.log(data);

    } catch (error) {
        console.log('@error', error)
    }
}
async function fetchLikers() {
    if (props.article.value && props.article.value?.like_count > 0) {
        try {
            const res = await getArticleLikes(props.article.id)
            likers.value = res.data
        } catch (error) {
            console.error('获取点赞列表失败', error);
        }
    } else {
        likers.value = []
    }
}
function toggleComment() {
    isShowInput.value = !isShowInput.value
}
async function toggleLike(articleId: number) {
    const res = await feedStore.toggleLike(articleId)
    if (res) {
        await fetchLikers()
    }
}

async function handleSendReply(replyData: { content: string, parentId?: string }) {
    if (!props.article.value) return
    const id = messageStore.show('正在创建评论', 'loading',)
    const success = await feedStore.createComment({
        articleId: props.article.value.id.toString(),
        content: replyData.content,
        parentId: replyData.parentId
    })

    if (success) {
        feedStore.fetchInitialComments(props.article.value.id.toString())
        messageStore.update(id, { type: 'success', text: '评论成功', duration: 2000 })
    } else {
        console.error('评论失败');
        messageStore.update(id, { type: 'info', text: '请先登录账号', duration: 2000 })
    }
}
onMounted(() => {
    fetchLikers()
    feedStore.fetchInitialComments(props.article.id)
})
</script>

<template>
    <div class="article-item" v-if="props.article">
        <!-- 左侧头像 -->
        <div class="article-avatar">
            <img :src="props.article.user?.avatar" alt="avatar">
        </div>
        <!-- 内容 -->
        <div class="article-context">
            <!-- 用户昵称 -->
            <div class="nickname">
                <div>
                    <p>{{ props.article.user?.nickname || props.article.user.username }}</p>
                </div>
                <div class="tags">
                    <div class="tag-item" v-if="props.article.is_top">
                        <Icon class="tag-icon">
                            <Thumbtack />
                        </Icon>
                        <span>置顶</span>
                    </div>
                    <div class="tag-item" v-if="props.article.is_ad">
                        <Icon class="tag-icon">
                            <Ad />
                        </Icon>
                        <span>广告</span>
                    </div>
                </div>
            </div>
            <!-- 文章内容 -->
            <div class="main-context">
                <p>{{ props.article.content }}</p>
            </div>
            <div class="location" @click="showLocation">
                <p>{{ props.article.location }}</p>
            </div>
            <!-- 时间、点赞评论按钮 -->
            <ArticleActions :article="props.article" @like="toggleLike(props.article.id)" @comment="toggleComment" />
            <!-- 评论 -->
            <div class="review">
                <Review :article="props.article" :likers="likers" :comments="comments" :is-show-input="isShowInput"
                    :has-more="hasMore" :is-loading="isLoading" :remaining-comments="remainingComments"
                    :load-more="() => feedStore.fetchMoreComments(props.article.id)" @send-reply="handleSendReply" />
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