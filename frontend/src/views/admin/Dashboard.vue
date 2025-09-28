<script setup lang="ts" name="Dashboard">
import { ref } from 'vue'
import { getUserCount, getArticleCount, getCommentCount } from '@/api/admin';
import { Icon } from '@vicons/utils';
import { UserCircleRegular, Buffer, CommentRegular } from '@vicons/fa';

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
        // console.log('获取数据失败:', error);
        throw error;
    } finally {
        isLoading.value = false
    }
}
getAllCount()

// 定义语言
const languages = {
    HTML: {
        name: 'html',
        icon: 'https://img.shields.io/badge/HTML-239120?style=for-the-badge&logo=html5&logoColor=white'
    },
    CSS: {
        name: 'css',
        icon: 'https://img.shields.io/badge/CSS-239120?&style=for-the-badge&logo=css3&logoColor=white'
    },
    JavaScript: {
        name: 'javascript',
        icon: 'https://img.shields.io/badge/JavaScript-2CA550?style=for-the-badge&logo=JavaScript&logoColor=white'
    },
    TypeScript: {
        name: 'typescript',
        icon: 'https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white',
    },
    Vue: {
        name: 'vue',
        icon: 'https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D'
    },
    Axios: {
        name: 'axios',
        icon: 'https://img.shields.io/badge/Axios-%23039BE5.svg?&style=for-the-badge&logo=Axios&logoColor=white'
    },
    Pinia: {
        name: 'pinia',
        icon: 'https://img.shields.io/badge/Pinia-43853D?style=for-the-badge&logo=pinia&logoColor=#FBCE4B'
    },
    Shell: {
        name: 'shell',
        icon: 'https://img.shields.io/badge/Powershell-2CA5E0?style=for-the-badge&logo=powershell&logoColor=white'
    },
    NodeJs: {
        name: 'nodejs',
        icon: 'https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white'
    },
    NPM: {
        name: 'npm',
        icon: 'https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white'
    },
    Docker: {
        name: 'docker',
        icon: 'https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white'
    },
    Vercel: {
        name: 'vercel',
        icon: 'https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white'
    },
}
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
                <div class="card-title">已激活用户数</div>
                <div class="card-value">{{ counts.userCount?.activeCount || 0 }}</div>
                <div class="card-total">总计：{{ counts.userCount?.totalCount || 0 }}</div>
            </div>
        </div>

        <div class="top-card">
            <div class="top-card-left">
                <Icon>
                    <Buffer />
                </Icon>
            </div>
            <div class="top-card-right">
                <div class="card-title">已发表文章数</div>
                <div class="card-value">{{ counts.articleCount?.activeCount || 0 }}</div>
                <div class="card-total">总计：{{ counts.articleCount?.totalCount || 0 }}</div>
            </div>
        </div>

        <div class="top-card">
            <div class="top-card-left">
                <Icon>
                    <CommentRegular />
                </Icon>
            </div>
            <div class="top-card-right">
                <div class="card-title">已发表评论数</div>
                <div class="card-value">{{ counts.commentCount?.activeCount || 0 }}</div>
                <div class="card-total">总计：{{ counts.commentCount?.totalCount || 0 }}</div>
            </div>
        </div>
    </div>
    <div class="bottom">
        <div class="bottom-left">
            <h1>瞬刻后台管理页面</h1>
            <div>仓库地址：</div>
            <a target="_blank" rel="noopener noreferrer" href="https://github.com/reaishijie/moments">
                <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"
                    alt="GitHub">
            </a>
            <div>语言及工具：</div>
            <span class="languages">
                <span v-for="language in languages" class="language" :title="language.name">
                    <img :src="language.icon" :alt="language.name">
                </span>
            </span>
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
    height: auto;
    min-height: 20%;
    gap: 20px;
    overflow: visible;
    flex-wrap: wrap;
}

.top-card {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    padding: 15px;
    flex: 1;
    min-width: 250px;
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

.languages {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
}

.language {
    margin: 5px 10px 5px 0;
}

.card-title {
    font-size: medium; 
    color: #000000c9;
}

.card-value {
    font-size: xx-large; 
    color: deepskyblue;
}

.card-total {
    font-size: xx-small;
}

/* 移动端响应式优化 */
@media (max-width: 768px) {
    .top {
        flex-direction: column;
        gap: 15px;
        height: auto;
        overflow: visible;
    }
    
    .top-card {
        min-width: auto;
        width: 100%;
        padding: 15px 20px;
        justify-content: space-between;
        display: flex;
        flex-direction: row;
        align-items: center;
    }
    
    .top-card-left {
        font-size: 35px;
        flex-shrink: 0;
    }
    
    .top-card-right {
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: right;
    }
    
    .bottom {
        flex-direction: column;
        gap: 20px;
    }
    
    .bottom-left {
        padding: 20px;
    }
    
    .languages {
        gap: 5px;
        justify-content: flex-start;
    }
    
    .language {
        margin: 2px 5px 2px 0;
    }
    
    .language img {
        height: auto;
        max-width: 120px;
    }
}

@media (max-width: 480px) {
    .top-card {
        padding: 12px 15px;
        flex-direction: column;
        text-align: center;
        gap: 10px;
        justify-content: center;
        align-items: center;
    }
    
    .top-card-left {
        font-size: 30px;
        order: 1;
    }
    
    .top-card-right {
        align-items: center;
        text-align: center;
        order: 2;
    }
    
    .card-title {
        font-size: 14px;
        margin-bottom: 5px;
    }
    
    .card-value {
        font-size: 28px;
        margin-bottom: 3px;
    }
    
    .card-total {
        font-size: 12px;
    }
    
    .bottom-left {
        padding: 15px;
    }
    
    .bottom-left h1 {
        font-size: 1.5em;
        text-align: center;
    }
    
    .language img {
        max-width: 100px;
    }
}
</style>