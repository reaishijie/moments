import { defineStore } from "pinia";
import { reactive } from "vue";
export const useArticleStore = defineStore('article', () => {
    //数据
    const articles = reactive([
        {
        id: 'wqdqwdq001',
        nickname:'小辉',
        avatar: '/img/avatar.jpg',
        context: '这是一篇测试内容1',
        location: '北京',
        isLiked: true,
        createdAt: Date.now()
    },
    {
        id: 'wqdqwdq002',
        nickname:'小辉',
        avatar: '/img/avatar.jpg',
        context: `这是一篇文章内容：
                碧雲天，黃葉地，秋色連波，波上寒煙翠。
                山映斜陽天接水，芳草無情，更在斜陽外
                黯鄉魂，追旅思，夜夜除非，好夢留人睡。
                明月樓高休獨倚，酒入愁腸，化作相思淚。`,
        location: '西安',
        isLiked: false,
        createdAt: '1753490992681'
    },
    {
        id: 'wqdqwdq003',
        nickname:'小辉',
        avatar: '/img/avatar.jpg',
        context: '这是一篇测试内容3',
        location: '郑州',
        isLiked: false,
        createdAt: '1752960000000'
    },
    {
        id: 'wqdqwdq004',
        nickname:'小辉',
        avatar: '/img/avatar.jpg',
        context: '这是一篇测试内容4',
        location: '',
        isLiked: false,
        createdAt: '1752190992681'
    },
    {
        id: 'wqdqwdq005',
        nickname:'小辉',
        avatar: '/img/avatar.jpg',
        context: '这是一篇测试内容5',
        location: '美国·洛杉矶',
        isLiked: false,
        createdAt: '1721404800000'
    },
    ])

    return {
        articles,
    }
},
{
    
    persist: {
       storage: sessionStorage,
}
    }
    
)