import { defineStore } from "pinia";

export const useArticleStore = defineStore('article', () => {


    return {
        
    }
},
{
    
    persist: {
       storage: sessionStorage,
}
    }
    
)