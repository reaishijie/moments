export interface linkData {
    id: string,
    logo: string | null,
    sitename: string,
    brief: string | null,
    url: string,
    status: number,
    created_at: string,
    deleted_at: string | null,
    createdAt?: string,
    deletedAt?: string
}
export interface addLinkData {
    logo?: string,
    sitename: string,
    brief?: string,
    url: string
}

export interface adminLinkFormData extends addLinkData {
    status: number
}