<script setup lang="ts" name="Detail">
import { computed, onMounted, ref } from 'vue'
import { ChevronLeft, EllipsisH } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import ArticleItem from '@/components/article/ArticleItem.vue';
import router from '@/router';
import { useRoute } from 'vue-router';
import { type articleData } from '@/types/article';
import { useArticleStore } from '@/store/article';
import { updateArticle } from '@/api/articles';
import { useUserStore } from '@/store/user';
import { useMessageStore } from '@/store/message';

const articleStore = useArticleStore()
const userStore = useUserStore()
const messageStore = useMessageStore()
const route = useRoute()
const articleId = Number(route.params.articleId)
const isLoading = ref(true)
const article = ref<articleData | null>(null);
const isShowInput = ref(false)
const isMenuOpen = ref(false)
const isUpdating = ref(false)
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const isAdmin = computed(() => Number(userStore.profile?.role) === 1)
const isOwner = computed(() => !!article.value && String(article.value.user_id) === String(userStore.profile?.id))
const isInEditWindow = computed(() => {
    if (!article.value?.created_at) return false
    const createdAt = new Date(article.value.created_at).getTime()
    return !Number.isNaN(createdAt) && Date.now() - createdAt <= ONE_DAY_MS
})
const canEditArticle = computed(() => isAdmin.value || (isOwner.value && isInEditWindow.value))
const canManage = computed(() => isAdmin.value || canEditArticle.value)
function toggleComment() {
    isShowInput.value = !isShowInput.value
}
function editArticle() {
    if (!article.value) return
    if (!canEditArticle.value) {
        messageStore.show('文章发布超过1天后不能编辑', 'info', 2000)
        return
    }
    isMenuOpen.value = false
    router.push({ name: 'articleEdit', params: { articleId: article.value.id } })
}
async function patchArticle(payload: { isTop?: boolean; isAd?: boolean; status?: number }) {
    if (!article.value || isUpdating.value) return
    const id = messageStore.show('正在更新文章', 'loading')
    const currentIsLiked = article.value.isLiked
    try {
        isUpdating.value = true
        const res = await updateArticle(article.value.id, payload)
        const updatedArticle = {
            ...res.data.data,
            isLiked: currentIsLiked
        }
        article.value = updatedArticle
        articleStore.article = updatedArticle
        messageStore.update(id, { type: 'success', text: '更新成功', duration: 2000 })
        if (payload.status === 0) {
            router.replace({ name: 'index' })
        }
    } catch (error) {
        console.error('更新文章失败:', error)
        messageStore.update(id, { type: 'error', text: '更新失败', duration: 2000 })
    } finally {
        isUpdating.value = false
        isMenuOpen.value = false
    }
}

onMounted(async() => {
    if (userStore.token && !userStore.profile) {
        await userStore.fetchUserProfile()
    }
    if (articleId) {
        try {
            // 直接等待 API 调用返回的文章对象
            await articleStore.fetchArticle(articleId);
            // 将文章赋值给本地的 ref 变量
            article.value = articleStore.article;
            await articleStore.fetchLikers(articleId);
            await articleStore.fetchComments(articleId);
        } catch (error) {
            console.error('Failed to load article details:', error);
        } finally {
            isLoading.value = false;
        }
    }
})
</script>
<template>
    <div class="container">
        <!-- 顶部栏 -->
        <div class="header">
            <div id="back" @click="router.back()">
                <Icon>
                    <ChevronLeft />
                </Icon>
            </div>
            <div>内容详情</div>
            <div class="func">
                <button v-if="canManage" class="menu-button" type="button" @click.stop="isMenuOpen = !isMenuOpen" title="文章操作">
                    <Icon>
                        <EllipsisH />
                    </Icon>
                </button>
                <div v-if="isMenuOpen && canManage" class="action-menu">
                    <button v-if="canEditArticle" type="button" @click="editArticle">编辑文章</button>
                    <template v-if="isAdmin">
                        <button type="button" @click="patchArticle({ isTop: !article?.is_top })">
                            {{ article?.is_top ? '取消置顶' : '设为置顶' }}
                        </button>
                        <button type="button" @click="patchArticle({ isAd: !article?.is_ad })">
                            {{ article?.is_ad ? '取消广告' : '设为广告' }}
                        </button>
                        <button type="button" class="danger" @click="patchArticle({ status: 0 })">下架文章</button>
                    </template>
                </div>
            </div>
        </div>
        <!-- 文章展示 -->
        <div class="body">
            <span v-if="!article">正在加载中...</span>
            <ArticleItem 
                v-if="article"
                :article="article"
                :likers="articleStore.likers || []"
                :comments="articleStore.comments || []"
                :is-show-input="!!isShowInput"
                :has-more-comments= false
                :remaining-comments= 0
                :is-loading-comments= false
                @like="() => articleStore.toggleLike(articleId)"
                @comment="() => toggleComment()"
                @send-reply="(payload) => articleStore.createComment(payload)"
                @load-more-comments="() => console.warn('点击了load-more-comments, 暂时不支持加载更多')"
            />
        </div>
    </div>
</template>
<style scoped>
.container {
    display: flex;
    flex-direction: column;
    width: 100%;
    background-color: var(--color-bg-app);
}

/* 头部栏 */
.header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 6vh;
    background-color: var(--color-post-bar);
    padding: 0px 5px 0px 10px;
}

#back {
    width: 36px;
    height: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
}

#back:hover {
    color: #000000fb;
    background: #f0f0f08b;
    cursor: pointer;
    border-radius: 10px;
}

.func {
    position: relative;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.menu-button {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    color: var(--color-text-primary);
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.menu-button:hover {
    background: var(--color-ad);
}

.action-menu {
    position: absolute;
    top: 40px;
    right: 0;
    z-index: 20;
    min-width: 118px;
    padding: 6px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background-color: var(--color-bg-app);
    box-shadow: var(--color-shadow);
}

.action-menu button {
    width: 100%;
    border: none;
    border-radius: 5px;
    padding: 8px 10px;
    color: var(--color-text-primary);
    background: transparent;
    text-align: left;
    font-size: 13px;
    cursor: pointer;
}

.action-menu button:hover {
    background-color: var(--color-ad);
}

.action-menu button.danger {
    color: #e05a47;
}

/* 主体 */
.body {
    display: flex;
    flex-direction: column;
    /* width: min(100%,520px); */
    width: 100%;
    min-height: 100vh;
}
.body span {
    margin-top: 40vh;
    display: flex;
    justify-content: center;
    align-items: center;
    color: skyblue;
}
</style>
