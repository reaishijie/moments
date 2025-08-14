export interface articleData{
    id: number,
    nickname: string,
    avatar: string,
    context: string,
    location? : string,
    createdAt: string
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
