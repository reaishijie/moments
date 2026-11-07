import axios from 'axios';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { authService, buildDeviceFingerprint, ensureLoginAllowedUser } from './auth.service.js';
import { Logger } from '../utils/logger.js';
const logger = new Logger('OAuthService');
const LINUX_DO_AUTHORIZE_URL = 'https://connect.linux.do/oauth2/authorize';
const LINUX_DO_TOKEN_URL = 'https://connect.linux.do/oauth2/token';
const LINUX_DO_USERINFO_URL = 'https://connect.linux.do/api/user';
const DEFAULT_NODELOC_URL = 'https://www.nodeloc.com';
const DEFAULT_RAINBOW_CONNECT_URL = 'https://u.xiaobaixuan.com/connect.php';
const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USERINFO_URL = 'https://api.github.com/user';
const GITHUB_EMAILS_URL = 'https://api.github.com/user/emails';
const OAUTH_TICKET_EXPIRES_SECONDS = 10 * 60;
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error('.env 文件中未定义 JWT_SECRET');
    return secret;
}
async function getConfigValue(key) {
    const config = await prisma.config.findUnique({ where: { k: key }, select: { v: true } });
    return config?.v ?? '';
}
function getRequestOrigin(req) {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || '';
    return `${protocol}://${host}`;
}
function normalizeProviderType(type) {
    return typeof type === 'string' ? type.trim().toLowerCase() : '';
}
function buildCallbackUrl(req, path) {
    return new URL(path, getRequestOrigin(req)).toString();
}
async function getRainbowConnectUrl() {
    const configuredUrl = (await getConfigValue('rainbow_oauth2_api_url')).trim();
    return configuredUrl || DEFAULT_RAINBOW_CONNECT_URL;
}
async function getNodelocBaseUrl() {
    const configuredUrl = (await getConfigValue('nodeloc_url')).trim().replace(/\/$/, '');
    return configuredUrl || DEFAULT_NODELOC_URL;
}
function isOAuthStateProvider(provider) {
    return provider === 'linux_do'
        || provider === 'nodeloc'
        || provider === 'rainbow'
        || provider === 'google'
        || provider === 'github';
}
export class OAuthService {
    signTicket(profile) {
        const payload = {
            scope: 'oauth_bind',
            provider: profile.provider,
            providerType: profile.providerType ?? null,
            providerUserId: profile.providerUserId,
            nickname: profile.nickname ?? null,
            avatar: profile.avatar ?? null,
            email: profile.email ?? null,
        };
        return jwt.sign(payload, getJwtSecret(), { expiresIn: OAUTH_TICKET_EXPIRES_SECONDS, algorithm: 'HS256' });
    }
    verifyTicket(ticket) {
        const decoded = jwt.verify(ticket, getJwtSecret(), { algorithms: ['HS256'] });
        if (decoded.scope !== 'oauth_bind' || !decoded.provider || !decoded.providerUserId) {
            throw new Error('Invalid oauth ticket');
        }
        return decoded;
    }
    async buildLinuxDoAuthorizeUrl(req) {
        const enabled = await getConfigValue('linux_do_oauth2');
        if (enabled !== '1')
            throw new Error('Linux.Do OAuth 未启用');
        const clientId = await getConfigValue('linux_do_client_id');
        if (!clientId)
            throw new Error('Linux.Do OAuth Client ID 未配置');
        const configuredRedirectUri = await getConfigValue('oauth2_redirect_uri');
        const redirectUri = configuredRedirectUri || buildCallbackUrl(req, '/api/auth/callback');
        const state = jwt.sign({ scope: 'oauth_state', provider: 'linux_do' }, getJwtSecret(), { expiresIn: 10 * 60, algorithm: 'HS256' });
        const url = new URL(LINUX_DO_AUTHORIZE_URL);
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', 'openid profile email');
        url.searchParams.set('state', state);
        return url.toString();
    }
    async fetchLinuxDoProfile(input) {
        if (input.state) {
            const state = jwt.verify(input.state, getJwtSecret(), { algorithms: ['HS256'] });
            if (state.scope !== 'oauth_state' || state.provider !== 'linux_do') {
                throw new Error('Invalid oauth state');
            }
        }
        const clientId = await getConfigValue('linux_do_client_id');
        const clientSecret = await getConfigValue('linux_do_client_secret');
        const configuredRedirectUri = await getConfigValue('oauth2_redirect_uri');
        const redirectUri = configuredRedirectUri || buildCallbackUrl(input.req, '/api/auth/callback');
        if (!clientId || !clientSecret)
            throw new Error('Linux.Do OAuth 未完整配置');
        const tokenResponse = await axios.post(LINUX_DO_TOKEN_URL, new URLSearchParams({
            grant_type: 'authorization_code',
            code: input.code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000,
        });
        const accessToken = String(tokenResponse.data?.access_token || '');
        if (!accessToken)
            throw new Error('Linux.Do OAuth 未返回 access_token');
        const userResponse = await axios.get(LINUX_DO_USERINFO_URL, {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 10000,
        });
        const profile = userResponse.data ?? {};
        const providerUserId = String(profile.sub || '');
        if (!providerUserId)
            throw new Error('Linux.Do OAuth 未返回用户标识');
        return {
            provider: 'linux_do',
            providerType: null,
            providerUserId,
            nickname: profile.name || profile.username || profile.login || null,
            avatar: profile.avatar_url || null,
            email: profile.email || null,
            accessToken,
            refreshToken: tokenResponse.data?.refresh_token || null,
            rawProfile: profile,
        };
    }
    async buildNodelocAuthorizeUrl(req) {
        const enabled = await getConfigValue('nodeloc_oauth2');
        if (enabled !== '1')
            throw new Error('NodeLoc OAuth 未启用');
        const clientId = await getConfigValue('nodeloc_client_id');
        if (!clientId)
            throw new Error('NodeLoc OAuth Client ID 未配置');
        const baseUrl = await getNodelocBaseUrl();
        const configuredRedirectUri = await getConfigValue('oauth2_redirect_uri');
        const redirectUri = configuredRedirectUri || buildCallbackUrl(req, '/api/auth/callback');
        const state = jwt.sign({ scope: 'oauth_state', provider: 'nodeloc' }, getJwtSecret(), { expiresIn: 10 * 60, algorithm: 'HS256' });
        const url = new URL(`${baseUrl}/oauth-provider/authorize`);
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('response_type', 'code');
        // email scope 需要 NodeLoc 管理员审核，默认只申请 openid + profile
        url.searchParams.set('scope', 'openid profile');
        url.searchParams.set('state', state);
        return url.toString();
    }
    async fetchNodelocProfile(input) {
        if (input.state) {
            const state = jwt.verify(input.state, getJwtSecret(), { algorithms: ['HS256'] });
            if (state.scope !== 'oauth_state' || state.provider !== 'nodeloc') {
                throw new Error('Invalid oauth state');
            }
        }
        const clientId = await getConfigValue('nodeloc_client_id');
        const clientSecret = await getConfigValue('nodeloc_client_secret');
        const configuredRedirectUri = await getConfigValue('oauth2_redirect_uri');
        const redirectUri = configuredRedirectUri || buildCallbackUrl(input.req, '/api/auth/callback');
        if (!clientId || !clientSecret)
            throw new Error('NodeLoc OAuth 未完整配置');
        const baseUrl = await getNodelocBaseUrl();
        const tokenResponse = await axios.post(`${baseUrl}/oauth-provider/token`, new URLSearchParams({
            grant_type: 'authorization_code',
            code: input.code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000,
        });
        const accessToken = String(tokenResponse.data?.access_token || '');
        if (!accessToken)
            throw new Error('NodeLoc OAuth 未返回 access_token');
        const userResponse = await axios.get(`${baseUrl}/oauth-provider/userinfo`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 10000,
        });
        const profile = userResponse.data ?? {};
        const providerUserId = String(profile.id ?? profile.sub ?? '');
        if (!providerUserId)
            throw new Error('NodeLoc OAuth 未返回用户标识');
        return {
            provider: 'nodeloc',
            providerType: null,
            providerUserId,
            nickname: profile.name || profile.username || null,
            avatar: profile.avatar_url || null,
            email: profile.email || null,
            accessToken,
            refreshToken: tokenResponse.data?.refresh_token || null,
            rawProfile: profile,
        };
    }
    async buildGoogleAuthorizeUrl(req) {
        const enabled = await getConfigValue('google_oauth2');
        if (enabled !== '1')
            throw new Error('Google OAuth 未启用');
        const clientId = await getConfigValue('google_client_id');
        if (!clientId)
            throw new Error('Google OAuth Client ID 未配置');
        const configuredRedirectUri = await getConfigValue('oauth2_redirect_uri');
        const redirectUri = configuredRedirectUri || buildCallbackUrl(req, '/api/auth/callback');
        const state = jwt.sign({ scope: 'oauth_state', provider: 'google' }, getJwtSecret(), { expiresIn: 10 * 60, algorithm: 'HS256' });
        const url = new URL(GOOGLE_AUTHORIZE_URL);
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('scope', 'openid email profile');
        url.searchParams.set('state', state);
        url.searchParams.set('access_type', 'online');
        url.searchParams.set('prompt', 'select_account');
        return url.toString();
    }
    async fetchGoogleProfile(input) {
        if (input.state) {
            const state = jwt.verify(input.state, getJwtSecret(), { algorithms: ['HS256'] });
            if (state.scope !== 'oauth_state' || state.provider !== 'google') {
                throw new Error('Invalid oauth state');
            }
        }
        const clientId = await getConfigValue('google_client_id');
        const clientSecret = await getConfigValue('google_client_secret');
        const configuredRedirectUri = await getConfigValue('oauth2_redirect_uri');
        const redirectUri = configuredRedirectUri || buildCallbackUrl(input.req, '/api/auth/callback');
        if (!clientId || !clientSecret)
            throw new Error('Google OAuth 未完整配置');
        const tokenResponse = await axios.post(GOOGLE_TOKEN_URL, new URLSearchParams({
            grant_type: 'authorization_code',
            code: input.code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000,
        });
        const accessToken = String(tokenResponse.data?.access_token || '');
        if (!accessToken)
            throw new Error('Google OAuth 未返回 access_token');
        const userResponse = await axios.get(GOOGLE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 10000,
        });
        const profile = userResponse.data ?? {};
        const providerUserId = String(profile.sub || '');
        if (!providerUserId)
            throw new Error('Google OAuth 未返回用户标识');
        return {
            provider: 'google',
            providerType: null,
            providerUserId,
            nickname: profile.name || profile.given_name || profile.email || null,
            avatar: profile.picture || null,
            email: profile.email || null,
            accessToken,
            refreshToken: tokenResponse.data?.refresh_token || null,
            rawProfile: profile,
        };
    }
    async buildGithubAuthorizeUrl(req) {
        const enabled = await getConfigValue('github_oauth2');
        if (enabled !== '1')
            throw new Error('GitHub OAuth 未启用');
        const clientId = await getConfigValue('github_client_id');
        if (!clientId)
            throw new Error('GitHub OAuth Client ID 未配置');
        const configuredRedirectUri = await getConfigValue('oauth2_redirect_uri');
        const redirectUri = configuredRedirectUri || buildCallbackUrl(req, '/api/auth/callback');
        const state = jwt.sign({ scope: 'oauth_state', provider: 'github' }, getJwtSecret(), { expiresIn: 10 * 60, algorithm: 'HS256' });
        const url = new URL(GITHUB_AUTHORIZE_URL);
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('scope', 'read:user user:email');
        url.searchParams.set('state', state);
        url.searchParams.set('allow_signup', 'true');
        return url.toString();
    }
    async fetchGithubProfile(input) {
        if (input.state) {
            const state = jwt.verify(input.state, getJwtSecret(), { algorithms: ['HS256'] });
            if (state.scope !== 'oauth_state' || state.provider !== 'github') {
                throw new Error('Invalid oauth state');
            }
        }
        const clientId = await getConfigValue('github_client_id');
        const clientSecret = await getConfigValue('github_client_secret');
        const configuredRedirectUri = await getConfigValue('oauth2_redirect_uri');
        const redirectUri = configuredRedirectUri || buildCallbackUrl(input.req, '/api/auth/callback');
        if (!clientId || !clientSecret)
            throw new Error('GitHub OAuth 未完整配置');
        const tokenResponse = await axios.post(GITHUB_TOKEN_URL, {
            client_id: clientId,
            client_secret: clientSecret,
            code: input.code,
            redirect_uri: redirectUri,
        }, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });
        const accessToken = String(tokenResponse.data?.access_token || '');
        if (!accessToken) {
            throw new Error(tokenResponse.data?.error_description || tokenResponse.data?.error || 'GitHub OAuth 未返回 access_token');
        }
        const userResponse = await axios.get(GITHUB_USERINFO_URL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.github+json',
                'User-Agent': 'moments-oauth',
            },
            timeout: 10000,
        });
        const profile = userResponse.data ?? {};
        const providerUserId = String(profile.id ?? '');
        if (!providerUserId)
            throw new Error('GitHub OAuth 未返回用户标识');
        let email = profile.email || null;
        if (!email) {
            try {
                const emailsResponse = await axios.get(GITHUB_EMAILS_URL, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: 'application/vnd.github+json',
                        'User-Agent': 'moments-oauth',
                    },
                    timeout: 10000,
                });
                const emails = Array.isArray(emailsResponse.data) ? emailsResponse.data : [];
                const primaryVerified = emails.find((item) => item.primary && item.verified && item.email);
                const anyVerified = emails.find((item) => item.verified && item.email);
                const anyEmail = emails.find((item) => item.email);
                email = primaryVerified?.email || anyVerified?.email || anyEmail?.email || null;
            }
            catch (error) {
                logger.warn('获取 GitHub 邮箱失败，将继续使用基础资料');
            }
        }
        return {
            provider: 'github',
            providerType: null,
            providerUserId,
            nickname: profile.name || profile.login || null,
            avatar: profile.avatar_url || null,
            email,
            accessToken,
            refreshToken: tokenResponse.data?.refresh_token || null,
            rawProfile: profile,
        };
    }
    /**
     * 统一回调：根据 query.type（彩虹）或 state.provider 路由到对应 Provider。
     */
    async resolveCallbackProfile(input) {
        if (input.type) {
            return this.fetchRainbowProfile({ code: input.code, type: input.type });
        }
        if (!input.state) {
            // 兼容旧版仅 Linux.Do 的无 state 回调
            return this.fetchLinuxDoProfile({ code: input.code, req: input.req });
        }
        const state = jwt.verify(input.state, getJwtSecret(), { algorithms: ['HS256'] });
        if (state.scope !== 'oauth_state' || !state.provider || !isOAuthStateProvider(state.provider)) {
            throw new Error('Invalid oauth state');
        }
        if (state.provider === 'nodeloc') {
            return this.fetchNodelocProfile({ code: input.code, state: input.state, req: input.req });
        }
        if (state.provider === 'linux_do') {
            return this.fetchLinuxDoProfile({ code: input.code, state: input.state, req: input.req });
        }
        if (state.provider === 'google') {
            return this.fetchGoogleProfile({ code: input.code, state: input.state, req: input.req });
        }
        if (state.provider === 'github') {
            return this.fetchGithubProfile({ code: input.code, state: input.state, req: input.req });
        }
        throw new Error(`不支持的 OAuth provider: ${state.provider}`);
    }
    async buildRainbowLoginUrl(req, rawType) {
        const enabled = await getConfigValue('rainbow_oauth2');
        if (enabled !== '1')
            throw new Error('彩虹聚合登录未启用');
        const type = normalizeProviderType(rawType);
        const allowedTypes = (await getConfigValue('rainbow_oauth2_type')).split(',').map(item => item.trim()).filter(Boolean);
        if (!type || !allowedTypes.includes(type))
            throw new Error('不支持的彩虹聚合登录平台');
        const appid = await getConfigValue('rainbow_oauth2_appid');
        const appkey = await getConfigValue('rainbow_oauth2_appkey');
        if (!appid || !appkey)
            throw new Error('彩虹聚合登录未完整配置');
        const configuredRedirectUri = await getConfigValue('oauth2_redirect_uri');
        const redirectUri = configuredRedirectUri || buildCallbackUrl(req, '/api/auth/callback');
        const connectUrl = await getRainbowConnectUrl();
        const response = await axios.get(connectUrl, {
            params: { act: 'login', appid, appkey, type, redirect_uri: redirectUri },
            timeout: 10000,
        });
        if (response.data?.code !== 0 || !response.data?.url) {
            throw new Error(response.data?.msg || '获取彩虹聚合登录地址失败');
        }
        return {
            type,
            url: String(response.data.url),
            qrcode: response.data.qrcode ? String(response.data.qrcode) : undefined,
        };
    }
    async fetchRainbowProfile(input) {
        const type = normalizeProviderType(input.type);
        if (!type)
            throw new Error('缺少彩虹聚合登录平台');
        const appid = await getConfigValue('rainbow_oauth2_appid');
        const appkey = await getConfigValue('rainbow_oauth2_appkey');
        if (!appid || !appkey)
            throw new Error('彩虹聚合登录未完整配置');
        const connectUrl = await getRainbowConnectUrl();
        const response = await axios.get(connectUrl, {
            params: { act: 'callback', appid, appkey, type, code: input.code },
            timeout: 10000,
        });
        const data = response.data ?? {};
        if (data.code !== 0)
            throw new Error(data.msg || '彩虹聚合登录回调失败');
        const providerUserId = String(data.social_uid || '');
        if (!providerUserId)
            throw new Error('彩虹聚合登录未返回用户标识');
        return {
            provider: 'rainbow',
            providerType: type,
            providerUserId,
            nickname: data.nickname || null,
            avatar: data.faceimg || null,
            email: null,
            accessToken: data.access_token || null,
            rawProfile: data,
        };
    }
    async loginOrCreateTicket(profile, req) {
        const account = await prisma.user_oauth_accounts.findUnique({
            where: {
                provider_provider_type_provider_user_id: {
                    provider: profile.provider,
                    provider_type: profile.providerType ?? '',
                    provider_user_id: profile.providerUserId,
                },
            },
            include: { user: true },
        });
        if (account) {
            const user = await ensureLoginAllowedUser(account.user_id);
            if (!user)
                throw new Error('用户状态异常，无法登录');
            await prisma.user_oauth_accounts.update({
                where: { id: account.id },
                data: {
                    nickname: profile.nickname ?? account.nickname,
                    avatar: profile.avatar ?? account.avatar,
                    email: profile.email ?? account.email,
                    access_token: profile.accessToken ?? account.access_token,
                    refresh_token: profile.refreshToken ?? account.refresh_token,
                    raw_profile: profile.rawProfile === undefined ? account.raw_profile : profile.rawProfile,
                    last_login_at: new Date(),
                },
            });
            return authService.issueTokenPair({
                userId: account.user_id,
                deviceFingerprint: buildDeviceFingerprint(req),
            });
        }
        return {
            needBind: true,
            oauthTicket: this.signTicket(profile),
            profile: {
                provider: profile.provider,
                providerType: profile.providerType ?? null,
                providerUserId: profile.providerUserId,
                nickname: profile.nickname ?? null,
                avatar: profile.avatar ?? null,
                email: profile.email ?? null,
            },
        };
    }
    async bindTicketToUser(input) {
        const ticket = this.verifyTicket(input.ticket);
        const existing = await prisma.user_oauth_accounts.findUnique({
            where: {
                provider_provider_type_provider_user_id: {
                    provider: ticket.provider,
                    provider_type: ticket.providerType ?? '',
                    provider_user_id: ticket.providerUserId,
                },
            },
        });
        if (existing && existing.user_id !== input.userId) {
            throw new Error('该第三方账号已绑定其他用户');
        }
        const account = await prisma.user_oauth_accounts.upsert({
            where: {
                provider_provider_type_provider_user_id: {
                    provider: ticket.provider,
                    provider_type: ticket.providerType ?? '',
                    provider_user_id: ticket.providerUserId,
                },
            },
            create: {
                user_id: input.userId,
                provider: ticket.provider,
                provider_type: ticket.providerType ?? '',
                provider_user_id: ticket.providerUserId,
                nickname: ticket.nickname ?? null,
                avatar: ticket.avatar ?? null,
                email: ticket.email ?? null,
                last_login_at: new Date(),
            },
            update: {
                nickname: ticket.nickname ?? undefined,
                avatar: ticket.avatar ?? undefined,
                email: ticket.email ?? undefined,
                last_login_at: new Date(),
            },
        });
        logger.log(`OAuth 账号绑定成功：${account.provider}/${account.provider_type}/${account.provider_user_id} -> user ${input.userId.toString()}`);
        return account;
    }
}
export const oauthService = new OAuthService();
