import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { assertSecureSecret } from '../utils/secret.js';
const JWT_ALGORITHM = 'HS256';
function readPositiveIntEnv(name, fallback) {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}
export const ACCESS_TOKEN_TTL_SECONDS = readPositiveIntEnv('JWT_ACCESS_EXPIRES_SECONDS', 2 * 60 * 60);
export const REFRESH_TOKEN_TTL_SECONDS = readPositiveIntEnv('JWT_REFRESH_EXPIRES_SECONDS', 30 * 24 * 60 * 60);
export const AUTH_TOKEN_SCOPE = process.env.JWT_SCOPE || 'user';
export class TokenService {
    scope;
    accessTtlSeconds;
    refreshTtlSeconds;
    secret;
    constructor(secret = process.env.JWT_SECRET, scope = AUTH_TOKEN_SCOPE, accessTtlSeconds = ACCESS_TOKEN_TTL_SECONDS, refreshTtlSeconds = REFRESH_TOKEN_TTL_SECONDS) {
        this.scope = scope;
        this.accessTtlSeconds = accessTtlSeconds;
        this.refreshTtlSeconds = refreshTtlSeconds;
        assertSecureSecret('JWT_SECRET', secret);
        this.secret = secret.trim();
    }
    signToken(input) {
        const now = Math.floor(Date.now() / 1000);
        const ttl = input.tokenType === 'access' ? this.accessTtlSeconds : this.refreshTtlSeconds;
        return jwt.sign({
            sub: input.userId.toString(),
            scope: this.scope,
            tokenType: input.tokenType,
            sid: input.sid,
            jti: input.jti,
            deviceId: input.deviceId,
            iat: now,
            exp: now + ttl,
        }, this.secret, { algorithm: JWT_ALGORITHM });
    }
    verify(token) {
        // 显式固定算法，避免算法混淆类攻击
        return jwt.verify(token, this.secret, { algorithms: [JWT_ALGORITHM] });
    }
    createJti() {
        return randomUUID();
    }
}
export const tokenService = new TokenService();
