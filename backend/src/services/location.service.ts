function normalizeIp(ip?: string) {
    if (!ip) return ''
    return ip.replace(/^::ffff:/, '')
}

function isLocalOrPrivateIp(ip: string) {
    return !ip
        || ip === '127.0.0.1'
        || ip === '::1'
        || ip === 'localhost'
        || ip.startsWith('10.')
        || ip.startsWith('192.168.')
        || /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
}

export async function getLocation(ip?: string) {
    const normalizedIp = normalizeIp(ip)

    if (isLocalOrPrivateIp(normalizedIp)) {
        return {
            ip: normalizedIp || ip || '',
            country: '本地网络',
            province: '',
            city: '',
        }
    }

    try {
        const { default: axios } = await import("axios")
        const location = await axios.get(`https://v.api.aa1.cn/api/chinaip/?ip=${encodeURIComponent(normalizedIp)}`, {
            timeout: 5000,
        })
        return location.data
    } catch (error) {
        console.error('IP Service Error:', error)
        return {
            ip: normalizedIp,
            country: '',
            province: '',
            city: '',
        }
    }
}
