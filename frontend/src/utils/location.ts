const api = import.meta.env.VITE_API_BASE_URL

type LocationResponse = {
  data?: unknown
}

type LocationResult = Record<string, any>

function pickLocationResult(payload: unknown): LocationResult | undefined {
  const responseData = (payload as LocationResponse)?.data

  if (!responseData) return undefined
  if (typeof responseData !== 'object') return undefined

  const data = responseData as LocationResult
  if (data.data && typeof data.data === 'object') return data.data as LocationResult
  if (data.result && typeof data.result === 'object') return data.result as LocationResult
  return data
}

function getLocationText(result?: LocationResult) {
  if (!result) return ''

  const province = result.province || result.Province || result.region || result.Region || result.subdivisions || result.pro || ''
  const city = result.city || result.City || result.cityName || ''
  const country = result.country || result.Country || result.countryName || ''

  return [province, city].filter(Boolean).join(' ') || country || ''
}

async function getLocation() {
  try {
    const response = await fetch(`${api}/location`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('获取 IP 地址服务响应失败')
    }

    const payload = await response.json()
    const result = pickLocationResult(payload)

    return {
      result,
      text: getLocationText(result),
    }
  } catch (error) {
    console.error('获取 IP 地址失败:', error)
  }
}
export {
  getLocation
}
