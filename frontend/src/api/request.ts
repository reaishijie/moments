import axios from "axios"

// 创建 axios 实例
const service = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000,
})

// 添加请求拦截器
service.interceptors.request.use(
    async (config) => {
        // 请求发送前执行此函数
        // 获取store实例
        const { useUserStore } = await import('@/store/user')
        const userStore = useUserStore()
        const token = userStore.token
        // 如果token存在为每个请求的请求头都带上Authorization
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        console.error('请求拦截器发送错误：', error)
        return Promise.reject(error)
    }
)
// 响应拦截器
service.interceptors.response.use(
    (response) => {
        // 直接返回response下的data数据(TS层面有点问题，先不这样写)
        return response
    },
    async (error) => {
        const { useUserStore } = await import('@/store/user');
        const userStore = useUserStore();
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    console.error('认证失败，Token无效或已过期，请重新登录。')
                    // 执行退出
                    userStore.handleLogout()
                    break
                case 403:
                    console.error('权限不足，无法访问资源。', error)
                    break
                case 404:
                    console.error('请求的资源并不存在')
                    break
                default:
                    console.error(`请求错误：\n 状态码： ${error.response.status}, \n 原因： ${error.response.data.error}`)
            }
        } else if (error.request) {
            // 请求发送但未收到响应
            console.error('网络错误，请检查网络连接或后端服务是否正常。')
        } else {
            // 发送请求时出了错误
            console.error('请求发送失败：', error.message)
        }
        return Promise.reject(error)
    }
)

export default service