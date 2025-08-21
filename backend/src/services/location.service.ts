import axios from "axios"

export async function location(ip?:string | undefined) {
    try {
        const ip = await axios.get('https://ip.plus/myip')
        const location = await axios.get(`https://api.ip.plus/${ip.data}`)
        // const location = await axios.get(`https://api.ip.plus/${ip}`)
        return location.data
    } catch (error) {
        console.error('IP Service Error:', error)
        throw error
    }
}