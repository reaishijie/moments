export interface userData {
    id: number,
    username: string,
    nickname: string,
    brief:string,
    role: string,
    headerBackground: string,
    avatar: string,
}

export interface registerData {
    username: string,
    password: string,
    email? : string
}

export interface loginData {
    identifier: string  // identifier 是username或email
    password: string
}

export interface updateUserInfoData {
    brief?: string,
    nickname?: string,
    header_background?: string,
    avater?: string

}