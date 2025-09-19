<script setup lang="ts" name="Dashboard">
import { ref } from 'vue'
import { getUserCount, getArticleCount, getCommentCount } from '@/api/admin';
import { Icon } from '@vicons/utils';
import { UserCircleRegular, Buffer, CommentRegular, Github } from '@vicons/fa';

// 后端返回数据类型
interface countData {
    message: string,
    totalCount: number,
    activeCount: number,
    negativeCount: number
}
// 定义储存的数据类型
const counts = ref<{
    userCount: countData | null;
    articleCount: countData | null;
    commentCount: countData | null;
}>({
    userCount: null,
    articleCount: null,
    commentCount: null
});
// 是否数据还在加载中
const isLoading = ref(true)
// 获取对应的数目
async function getAllCount() {
    try {
        const [userCount, articleCount, commentCount] = await Promise.all([
            getUserCount(),
            getArticleCount(),
            getCommentCount()
        ])
        // 这里处理所有请求都成功返回的结果
        counts.value.userCount = userCount.data
        counts.value.articleCount = articleCount.data
        counts.value.commentCount = commentCount.data
    } catch (error) {
        console.log('获取数据失败:', error);
        throw error;
    } finally {
        isLoading.value = false
    }
}
getAllCount()
</script>

<template>
    <div class="top">
        <div class="top-card">
            <div class="top-card-left">
                <Icon>
                    <UserCircleRegular />
                </Icon>
            </div>
            <div class="top-card-right">
                <div style="font-size: medium; color: #000000c9;">已激活用户数</div>
                <div style="font-size: xx-large; color: deepskyblue;">{{ counts.userCount?.activeCount }}</div>
                <div style="font-size: xx-small;">总计：{{ counts.userCount?.totalCount }}</div>
            </div>
        </div>

        <div class="top-card">
            <div class="top-card-left">
                <Icon>
                    <Buffer />
                </Icon>
            </div>
            <div class="top-card-right">
                <div style="font-size: medium; color: #000000c9;">已发表文章数</div>
                <div style="font-size: xx-large; color: deepskyblue;">{{ counts.articleCount?.activeCount }}</div>
                <div style="font-size: xx-small;">总计：{{ counts.articleCount?.totalCount }}</div>
            </div>
        </div>

        <div class="top-card">
            <div class="top-card-left">
                <Icon>
                    <CommentRegular />
                </Icon>
            </div>
            <div class="top-card-right">
                <div style="font-size: medium; color: #000000c9;">已发表评论数</div>
                <div style="font-size: xx-large; color: deepskyblue;">{{ counts.commentCount?.activeCount }}</div>
                <div style="font-size: xx-small;">总计：{{ counts.commentCount?.totalCount }}</div>
            </div>
        </div>
    </div>
    <div class="bottom">
        <div class="bottom-left">
            <h1>瞬刻后台管理页面</h1>
            仓库地址：<a target="_blank" rel="noopener noreferrer" href="https://github.com/reaishijie/moments">
                <Icon size="40px" color="#000000">
                    <Github />
                </Icon>
            </a>
            <p>其他内容计划施工中...</p>
        </div>
        <div class="bottom-right">

        </div>
    </div>
</template>

<style scoped>
.top {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 20%;
    gap: 20px;
    overflow: hidden;
    /* word-wrap: break-word; */
}

.top-card {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    padding: 5px;
    width: 33%;
    background: #ffffff;
    border-radius: 5px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.top-card-left {
    font-size: 40px;
}

.top-card-right {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

/* 底部大卡片 */
.bottom {
    display: flex;
    width: 100%;
    flex: 1;
    background-color: #ffffff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.bottom-left {
    padding: 10px;
}
</style>