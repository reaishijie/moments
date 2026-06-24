import axios from "axios";
export async function location(ip) {
    try {
        // const ip = await axios.get('https://ip.plus/myip')
        // const location = await axios.get(`https://api.ip.plus/${ip.data}`)
        const location = await axios.get(`https://api.pearktrue.cn/api/ip/details/`);
        // const location = await axios.get(`https://api.pearktrue.cn/api/ip/high/`)
        const { api_source, ...rest } = location.data;
        return rest;
    }
    catch (error) {
        console.error('IP Service Error:', error);
        throw error;
    }
}
