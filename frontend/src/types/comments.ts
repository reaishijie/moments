// 定义评论
export interface commentData {
    id: number;
    articleId: number;
    userId: number;
    parentId?: number;
    content: string;
    createdAt: string
}
// 创建新评论
export interface createCommentData {
    articleId: number;
    content: string;
    partentId?: number
}
export interface Comment {
    id: string;
    article_id: string;
    user_id: string;
    parent_id: string;
    parent_displayName:string
    content: string;
    created_at: string;
    user: {
        id: string;
        username: string;
        nickname: string;
        avatar: string
    }
}