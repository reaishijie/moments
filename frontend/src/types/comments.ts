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
    parentId?: number | string | null;
    captchaProof?: string;
}
export interface CommentUser {
    id: string;
    username: string;
    nickname: string | null;
    avatar: string | null;
}

export interface Comment {
    id: string;
    article_id: string;
    user_id: string;
    parent_id: string | null;
    parent_displayName: string | null;
    content: string;
    created_at: string;
    updated_at?: string;
    user: CommentUser;
    replies?: Comment[];
}