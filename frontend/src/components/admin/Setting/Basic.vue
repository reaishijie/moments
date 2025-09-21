<script setup lang="ts" name="Basic">
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
    const success = await settingStore.fetchConfig();
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
            Object.assign(settingStore.originalData, settingStore.data);
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
      <label for="sitename">网站名称：</label>
      <input v-model="settingStore.data.sitename" id="sitename" type="text" placeholder="在此输入网站名称">
    </div>
    <div class="item">
      <label for="site_url">网站网址：</label>
      <input v-model="settingStore.data.site_url" id="site_url" type="text" placeholder="网站网址">
    </div>
    <div class="item">
      <label for="site_logo">站点图标：</label>
      <input v-model="settingStore.data.site_logo" id="site_logo" type="text" placeholder="站点LOGO">
    </div>
    <div class="item">
      <label for="site_keywords">关键字：</label>
      <input v-model="settingStore.data.site_keywords" id="site_keywords" type="text" placeholder="关键字">
    </div>
    <div class="item">
      <label for="site_description">站点描述：</label>
      <input v-model="settingStore.data.site_description" id="site_description" type="text" placeholder="站点描述">
    </div>
    <div class="item">
      <label for="site_email">联系邮箱：</label>
      <input v-model="settingStore.data.site_email" id="site_email" type="text" placeholder="管理员邮箱">
    </div>
    <div class="item">
      <label for="site_background">网站背景：</label>
      <input v-model="settingStore.data.site_background" id="site_background" type="text" placeholder="网站背景">
    </div>
    <div class="item">
      <label for="site_avatar">首页头像：</label>
      <input v-model="settingStore.data.site_avatar" id="site_avatar" type="text" placeholder="首页头像">
    </div>
    <div class="item">
      <label for="site_header_background">首页背景：</label>
      <input v-model="settingStore.data.site_header_background" id="site_header_background" type="text" placeholder="首页背景">
    </div>
    <div class="item">
      <label for="site_brief">首页简介：</label>
      <input v-model="settingStore.data.site_brief" id="site_brief" type="text" placeholder="首页简介">
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
  width: 100px;
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