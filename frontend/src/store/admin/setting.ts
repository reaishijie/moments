/**
 * 让Ai把 Basic.vue 里的方法与数据全整合到 settingStore 了， 也方便 Email.vue 调用
 */
import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { type updateConfigData } from "@/types/admin";
import { getConfig } from '@/api/admin';

export const useSettingStore = defineStore('setting', () => {
    // 使用 ref 存储原始数据，并明确其类型
    const originalData = ref<updateConfigData>({});
    /**
     * 每次数据库config增加键值必须增加此处值
     * @example: keyname: ''
     */
    // 使用 reactive 存储表单数据，并明确其类型
    const data = reactive<updateConfigData>({
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
    const fetchConfig = async () => {
        try {
            const sqlData = await getConfig();
            // 使用 Object.assign 赋值给 reactive 对象
            Object.assign(data, sqlData.data);
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
        for (const key in data) {
            const typedKey = key as keyof updateConfigData;
            // 访问 ref 的值需要使用 .value
            if (data[typedKey] !== originalData.value[typedKey]) {
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
        for (const key in data) {
            const typedKey = key as keyof updateConfigData;
            if (data[typedKey] !== originalData.value[typedKey]) {
                updateData[typedKey] = data[typedKey];
            }
        }
        return updateData;
    };

    return {
        originalData,
        data,
        fetchConfig,
        hasChanged,
        getUpdateData
    };
});