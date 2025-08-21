export interface articleData {
    id: number,
    nickname: string,
    avatar: string,
    context: string,
    type: number,
    isTop?: boolean,
    isAd?: boolean,
    isLiked?: boolean,
    likeCount: number,
    commentCount: number,
    location?: string,
    createdAt: string,
    user: {
        id: string,
        username: string,
        nickname: string,
        avatar_url: string,
    },
    article_images: any[],
    article_videos: any[]
}
export interface createArticleData {
    content: string,
    status: number,
    location?: string
}

export interface updateArticleData {
    content: string,
    status: number,
    location?: string
}
