export interface articleData {
    id: number,
    user_id: number,
    nickname: string,
    avatar: string,
    content: string,
    type: number,
    is_top?: boolean,
    is_ad?: boolean,
    isLiked?: boolean,
    like_count: number,
    comment_count: number,
    location?: string,
    created_at: string,
    user: {
        id: string,
        username: string,
        nickname: string,
        avatar: string,
    },
    article_images: {
        id: string,
        article_id: string,
        image_url: string,
        sort_order: number,
        created_at: string
    }[],
    article_videos: any[]
}
export interface createArticleData {
    content: string,
    status: number,
    location?: string,
    isTop?: boolean,
    isAd?: boolean,
    type?: number,
    imageUrls?: string[],
    videoUrls?: string[]
}

export interface updateArticleData {
    content: string,
    status: number,
    location?: string
}
