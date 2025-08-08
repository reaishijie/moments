import { reactive } from "vue"
import { defineStore } from "pinia"
import { type IUser} from '@/types/user'

export const useUserStore = defineStore('user', () => {
    const user:IUser = reactive({
    id: 1,
    username: 'xiaohui',
    nickname:'小辉',
    brief: '更简洁、更现代化的内容发布平台',  /* ,你可以尝试发布任何你想发布的的内容，无论是文本、图像还是视频。 */
    role: 'admin',
    // headerBackground:'/img/header.jpg',
    headerBackground:'/img/background.mp4',
    avatar: '/img/avatar.jpg'
    })

    return {
        user
    }

},
{
    persist: true
}
)