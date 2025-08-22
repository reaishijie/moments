import { defineStore } from "pinia";
import { ref } from "vue";
export const useCommentStore = defineStore('comment', () => {
    const isShowInput = ref(false)

    return {
        isShowInput
    }
})