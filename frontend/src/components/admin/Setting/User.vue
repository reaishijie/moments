<script setup lang="ts" name="ASUser">
import { onMounted } from 'vue';
import { updateConfig } from '@/api/admin';
import { useSettingStore } from '@/store/admin/setting';
import { useMessageStore } from '@/store/message';
import { useUserStore } from '@/store/user';
import router from '@/router';

const userStore = useUserStore();
const messageStore = useMessageStore();
const settingStore = useSettingStore();

onMounted(async () => {
  const id = messageStore.show('正在加载信息中', 'loading');
  const success = await settingStore.getAllConfig();
  if (success) {
    messageStore.update(id, { 'type': 'success', 'text': '加载成功', 'duration': 2000 });
  } else {
    messageStore.update(id, { 'type': 'error', 'text': '加载信息失败', 'duration': 2000 });
    userStore.handleLogout();
    router.replace({ name: 'index' });
  }
});

const handleUpdate = async () => {
  // 检查是否有改动
  if (settingStore.hasChanged()) {
    // 获取已修改的数据
    const updateData = settingStore.getUpdateData();
    const id = messageStore.show('正在更新中...', 'loading');
    try {
      await updateConfig(updateData);
      messageStore.update(id, { 'type': 'success', 'text': '更新成功', 'duration': 2000 });
      // 更新成功后，同步原始数据
      Object.assign(settingStore.originalData, settingStore.configs);
    } catch (error) {
      messageStore.update(id, { 'type': 'error', 'text': '更新失败', 'duration': 2000 });
      console.error('更新失败:', error);
    }
  } else {
    messageStore.show('数据未改动', 'info', 2000);
  }
};

</script>

<template>
  <div class="basic-container">
    <div class="item">
      <label for="user_status">默认用户状态：</label>
      <div class="checkbox-item">
        <input type="checkbox" id="user_status" v-model="settingStore.configs.user_status" true-value="1"
          false-value="0" />
        <label for="user_status">{{ settingStore.configs.user_status === '1' ? '激活' : '未激活' }}</label>
      </div>
    </div>
    <div class="item">
      <label for="user_auth">邮箱验证：</label>
      <div class="checkbox-item">
        <input type="checkbox" id="user_auth" v-model="settingStore.configs.user_auth" true-value="1"
          false-value="0" />
        <label for="user_auth">{{ settingStore.configs.user_auth === '1' ? '已开启' : '已关闭' }} </label>
      </div>
    </div>
    <div class="item">
      <label for="user_captcha" title="hcaptcha接口">人机验证：</label>
      <div class="checkbox-item">
        <input type="checkbox" id="user_captcha" v-model="settingStore.configs.user_captcha" true-value="1"
          false-value="0" />
        <label for="user_captcha">{{ settingStore.configs.user_captcha === '0' ? '已关闭' : '已开启' }} </label>
      </div>
    </div>
    <div v-if="settingStore.configs.user_captcha === '1'">
        <div class="item">
          <label for="verify_hcaptcha_app">app密钥：</label>
          <input v-model="settingStore.configs.verify_hcaptcha_app" id="verify_hcaptcha_app" type="text" placeholder="如52c4***-***-***-***">
        </div>
        <div class="item">
          <label for="verify_hcaptcha_user">用户密钥：</label>
          <input v-model="settingStore.configs.verify_hcaptcha_user" id="verify_hcaptcha_user" type="text" placeholder="如ES_***">
        </div>
      </div>
    <button @click="handleUpdate">更 新</button>
  </div>
</template>

<style scoped>
.basic-container {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  background: #ffffff;
  width: 100%;
  height: auto;
  padding: 20px 50px;
}

.item {
  margin-top: 10px;
  display: flex;
}

label {
  font-size: medium;
  padding: 5px;
  color: rgba(0, 0, 0, 0.811);
  width: 150px;
}

input {
  flex: 1;
  max-width: 500px;
  border: none;
  border-bottom: 1px solid skyblue;
  outline: none;
  padding: 5px;
  margin: 5px 0px 5px 5px;
}

input:focus {
  border-bottom: 2px solid rgba(0, 0, 255, 0.296);
}

.checkbox-item {
  padding: 5px;
}

.checkbox-item:hover {
  cursor: pointer;
}

button {
  outline: none;
  border: none;
  background: #09C362;
  border-radius: 5px;
  width: 80px;
  padding: 5px;
  margin-top: 10px;
  color: #ffffff;
  font-size: small;
  cursor: pointer;
}

button:hover {
  background: #F8BC99;
}
</style>