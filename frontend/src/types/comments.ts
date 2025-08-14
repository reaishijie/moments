// 定义评论
export interface commentData {
    id: number,
    articleId: number,
    userId: number,
    parentId?: number,
    content: string,
    createdAt: string
}
// 创建新评论
export interface createCommentData {
    articleId: number,
    content: string,
    partentId: number
}