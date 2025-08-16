import { defineStore } from "pinia";
import { ref } from "vue";

export interface messageItem {
    id: number,
    text: string,
    type?: 'loading' | 'success' | 'info' | 'error',
    duration?: number,
}

export const useMessageStore = defineStore('message', () => {
    const messages = ref<messageItem[]>([])
    let counter = 0

    function show(text: string, type: messageItem['type'] = 'info', duration?: messageItem['duration']) {
        const id = ++counter
        messages.value.push({ id, text, type, duration })

        if (duration) {
            setTimeout(() => {
                close(id)
            }, duration);
        }
        return id
    }
    function update(id: number, payload: Partial<Omit<messageItem, "id">>) {
        const msg = messages.value.find((m) => m.id === id);
        if (msg) {
            Object.assign(msg, payload);

            // 如果更新后有了 duration（原来没传），延迟关闭
            if (payload.duration) {
                setTimeout(() => {
                    close(id);
                }, payload.duration);
            }
        }
    }
    function close(id: number) {
        messages.value = messages.value.filter(m => m.id !== id)
    }
    return {
        messages,
        show,
        update,
        close
    }
})