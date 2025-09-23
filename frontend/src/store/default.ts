import { defineStore } from "pinia";
import { ref } from "vue";
import { type updateConfigData } from "@/types/admin";
import { getPublicConfig as apiGetPublicConfig} from '@/api/admin';


export const useDefaultStore = defineStore('default', () => {
    const configs = ref<updateConfigData>({});

    const getPublicConfig = async() => {
        const res  = await apiGetPublicConfig()
        configs.value = res.data
        // console.log('@@@',res, configs.value);
    }
    return {
        configs,
        getPublicConfig
    };
});