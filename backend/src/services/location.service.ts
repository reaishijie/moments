import https from 'https'
import { isIP } from 'net'
import { Logger } from '../utils/logger.js'

const logger = new Logger('LocationService')
const ipv4HttpsAgent = new https.Agent({ family: 4 })

type LocationData = {
    ip: string
    country: string
    province: string
    city: string
}

function normalizeIp(ip?: string) {
    if (!ip) return ''
    const normalized = ip.trim().replace(/^::ffff:/, '')
    return normalized === '::1' ? '127.0.0.1' : normalized
}

function splitHeaderIps(value?: string | string[]) {
    if (!value) return []
    const headerValue = Array.isArray(value) ? value.join(',') : value
    return headerValue.split(',').map(ip => normalizeIp(ip)).filter(Boolean)
}

function isIpv4(ip: string) {
    return isIP(ip) === 4
}

function isLocalOrPrivateIp(ip: string) {
    return !ip
        || ip === '127.0.0.1'
        || ip === 'localhost'
        || ip.startsWith('10.')
        || ip.startsWith('192.168.')
        || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
        || ip === '::1'
        || ip.toLowerCase().startsWith('fc')
        || ip.toLowerCase().startsWith('fd')
        || ip.toLowerCase().startsWith('fe80:')
}

function createEmptyLocation(ip: string, country = ''): LocationData {
    return {
        ip,
        country,
        province: '',
        city: '',
    }
}

function readString(data: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
        const value = data[key]
        if (typeof value === 'string' && value.trim()) return value.trim()
    }
    return ''
}

function normalizeLocationResponse(payload: unknown, ip: string): LocationData {
    if (!payload || typeof payload !== 'object') return createEmptyLocation(ip)

    const root = payload as Record<string, unknown>
    const source = root.data && typeof root.data === 'object'
        ? root.data as Record<string, unknown>
        : root

    return {
        ip: readString(root, ['ip', 'ip_get']) || readString(source, ['ip']) || ip,
        country: readString(source, ['country', 'Country', 'countryName']),
        province: readString(source, ['province', 'Province', 'region', 'Region', 'pro']),
        city: readString(source, ['city', 'City', 'cityName']),
    }
}

export function getPreferredClientIp(candidates: Array<string | string[] | undefined>) {
    const ips = candidates.flatMap(splitHeaderIps)
    const publicIpv4 = ips.find(ip => isIpv4(ip) && !isLocalOrPrivateIp(ip))
    if (publicIpv4) return publicIpv4

    const anyIpv4 = ips.find(isIpv4)
    if (anyIpv4) return anyIpv4

    return ips.find(ip => !isLocalOrPrivateIp(ip)) || ips[0] || ''
}

export async function getLocation(ip?: string) {
    const normalizedIp = normalizeIp(ip)

    if (isLocalOrPrivateIp(normalizedIp)) {
        return createEmptyLocation(normalizedIp || ip || '', '本地网络')
    }

    try {
        const { default: axios } = await import('axios')
        const location = await axios.get('https://v.api.aa1.cn/api/chinaip/', {
            params: { ip: normalizedIp },
            timeout: 5000,
            httpsAgent: ipv4HttpsAgent,
            // 该接口存在 HTTP 500 但响应体 code=200 且数据有效的情况，不能让 axios 直接抛错。
            validateStatus: status => status >= 200 && status < 600,
        })
        return normalizeLocationResponse(location.data, normalizedIp)
    } catch (error) {
        logger.error('IP Service Error', error instanceof Error ? error.stack : String(error))
        return createEmptyLocation(normalizedIp)
    }
}
