export interface userData {
    id: string,
    username: string,
    email:string,
    nickname: string,
    brief:string,
    role: string,
    status:string,
    header_background: string,
    avatar: string,
    banned_until?: string | null,
    created_at:string
}

export interface registerData {
    username: string,
    password: string,
    email?: string,
    code?: string,
    status?: number,
    captchaProof?: string
}

export interface loginData {
    identifier: string  // identifier 是username或email
    password: string
    captchaProof?: string
}

export interface emailLoginData {
    email: string,
    code: string,
    captchaProof?: string
}

export interface resetPasswordData {
    email: string,
    code: string,
    password: string
}

export interface updateUserInfoData {
    brief?: string,
    nickname?: string,
    header_background?: string,
    avatar?: string,
    email?:string,
    status?: number,
    captchaProof?: string
}

export interface updatePasswordData {
    oldPassword: string,
    newPassword: string,
    captchaProof?: string
}

export interface updateUserData {
    username?: string,
    email?: string,
    nickname?: string,
    brief?: string,
    status?: number,
    role?: number,
    avatar?: string,
    header_background?: string,
    banned_until?: string | null
}