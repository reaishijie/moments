export interface linkData {
    id: string,
    logo: string,
    sitename: string,
    brief: string,
    url: string,
    status: number,
    createdAt: string,
    deletedAt: string
}
export interface addLinkData {
    logo?: string,
    sitename: string,
    brief?: string,
    url: string
}