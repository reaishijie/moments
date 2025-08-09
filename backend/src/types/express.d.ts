export interface JwtPayload {
    userId: string,
    username: string,
    role: number
}

// 通过合并声明，为 Express的 Request接口添加自定义的 user属性
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}