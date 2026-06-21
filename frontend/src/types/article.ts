export interface articleImageItem {
    id?: string,
    article_id?: string,
    image_url: string,
    sort_order?: number,
    created_at?: string
}
export interface articleVideoItem {
    id?: string,
    article_id?: string,
    video_url: string,
    thumbnail_url?: string,
    duration?: string,
    sort_order?: number,
    created_at?: string
}
export interface articleData {
    id: number,
    user_id: number,
    nickname: string,
    avatar: string,
    content: string,
    type: number,
    is_top?: boolean,
    is_ad?: boolean,
    ad_title: string,
    ad_url: string,
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
    article_images: articleImageItem[],
    article_videos: articleVideoItem[]
}
export interface createArticleData {
    content: string,
    status: number,
    location?: string,
    isTop?: boolean,
    isAd?: boolean,
    adTitle?: string,
    adUrl?: string,
    type?: number,
    imageUrls?: string[],
    videoUrls?: string[],
    thumbnail_url?: string
}

export interface updateArticleData {
    content?: string,
    status?: number,
    location?: string,
    type?: number,
    isAd?: boolean,
    isTop?: boolean,
    imageUrls?: string[],
    videoUrls?: string[]
}

export interface articleFilter {
    articleId?: string,
    userId?: string,
    content?: string,
    location?: string,
    type?: number,
    isTop?: boolean,
    isAd?: boolean
}
