import { defineStore } from "pinia";
import { ref } from "vue";

export interface messageItem {
    id: number,
    text: string,
    type?: 'loading' | 'success' | 'info' | 'error',
    duration: number
}

export const useMessageStore = defineStore('message', () => {
    const messages = ref<messageItem[]>([])
    let counter = 0

    function show(text: string, type: messageItem['type'] = 'info', duration: messageItem['duration'] = 2000) {
        const id = ++counter
        messages.value.push({id, text, type, duration})

        setTimeout(() => {
            messages.value = messages.value.filter(m => m.id !=id)
        }, duration);
    }
    return { 
        messages,
        show
    }
})