/**
 * 让 Ai 把 Basic.vue 里的方法与数据全整合到 settingStore 了， 也方便 Email.vue 调用
 */
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";
import { type updateConfigData } from "@/types/admin";
import { getConfig as apiGetConfig } from '@/api/admin';

export const useSettingStore = defineStore('setting', () => {
    // 使用 ref 存储原始数据，并明确其类型
    const originalData: Ref<updateConfigData> = ref({});
    
    // 使用 ref 存储表单数据，并明确其类型
    const configs: Ref<updateConfigData> = ref({
        sitename: '',
        site_url: '',
        site_logo: '',
        site_keywords: '',
        site_email: '',
        site_header_background: '',
        site_description: '',
        site_brief: '',
        site_background: '',
        site_avatar: '',
        mail_user: '',
        mail_secure: '',
        mail_port: '',
        mail_pass: '',
        mail_host: '',
        user_status: '',
        user_auth: '',
        user_captcha: '',
        verify_hcaptcha_user: '',
        verify_hcaptcha_app: '',
    });

    /**
     * @description 从后端获取配置数据并更新 store
     */
    const getAllConfig = async () => {
        try {
            const sqlData = await apiGetConfig();
            // 直接替换 ref 的 .value
            configs.value = sqlData.data;
            // 对 ref 的 .value 进行赋值，并确保深拷贝
            originalData.value = JSON.parse(JSON.stringify(sqlData.data));
            return true;
        } catch (error) {
            console.error('获取配置失败:', error);
            return false;
        }
    };

    /**
     * @description 检查数据是否有改动
     */
    const hasChanged = () => {
        // 确保比较的是 ref 的 .value
        for (const key in configs.value) {
            const typedKey = key as keyof updateConfigData;
            if (configs.value[typedKey] !== originalData.value[typedKey]) {
                return true;
            }
        }
        return false;
    };

    /**
     * @description 获取已修改的数据
     */
    const getUpdateData = (): updateConfigData => {
        const updateData: updateConfigData = {};
        // 确保遍历的是 ref 的 .value
        for (const key in configs.value) {
            const typedKey = key as keyof updateConfigData;
            if (configs.value[typedKey] !== originalData.value[typedKey]) {
                updateData[typedKey] = configs.value[typedKey];
            }
        }
        // console.log('@', updateData);
        
        return updateData;
    };

    return {
        originalData,
        configs,
        getAllConfig,
        hasChanged,
        getUpdateData
    };
});