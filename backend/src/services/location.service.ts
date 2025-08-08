import axios from "axios"

export async function getLocation() {
    try {
        const ip = await axios.get('https://ip.plus/myip')
        const location = await axios.get(`https://api.ip.plus/${ip.data}`)
        return location.data
    } catch (error) {
        console.error('IP Service Error:', error)
        throw error
    }
}