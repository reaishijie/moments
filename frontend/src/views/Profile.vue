<script setup lang="ts" name="Profile">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import AvatarImage from '@/components/utils/AvatarImage.vue';
import { ChevronLeft, ChevronRight } from '@vicons/fa';
import { Icon } from '@vicons/utils';
import router from '@/router';
import { useUserStore } from '@/store/user';
import { useMessageStore } from '@/store/message';
import { updateUserInfo, changePassword, getOAuthAccounts, type OAuthAccount } from '@/api/users';
import type { updatePasswordData } from '@/types/user';
import { isAxiosError } from 'axios';
import { useDefaultStore } from '@/store/default';
import { getApiBaseUrl } from '@/api/auth';
import { uploadFiles } from '@/api/upload';
import Captcha from '@/components/captcha/Captcha.vue';

const userStore = useUserStore()
const messageStore = useMessageStore()
const defaultStore = useDefaultStore()
const oauthAccounts = ref<OAuthAccount[]>([])
const captchaProof = ref<string>()
const captchaRef = ref<InstanceType<typeof Captcha> | null>(null)
const needCaptcha = computed(() => defaultStore.configs.user_captcha_update === '1')
const onCaptchaVerified = (data: { status: boolean, message: string, captchaProof?: string }) => {
  captchaProof.value = data.captchaProof
}
const clearCaptcha = () => {
  captchaProof.value = undefined
  captchaRef.value?.reset()
}
const states = reactive({
  avatar: false,
  header_background: false,
  role: false,
  status: false,
  nickname: false,
  username: false,
  email: false,
  brief: false,
  password: false,
  oauth: false
})
const userData = reactive({
  avatar: computed(() => userStore.profile?.avatar ?? '/img/avatar.jpg'),
  header_background: computed(() => userStore.profile?.header_background ?? '/img/header.jpg'),
  role: computed(() => Number(userStore.profile?.role) === 1 ? '管理员' : '用户'),
  status: computed(() => Number(userStore.profile?.status) === 1 ? '正常' : '异常'),
  nickname: computed(() => userStore.profile?.nickname ?? '未设置'),
  username: computed(() => userStore.profile?.username),
  email: computed(() => userStore.profile?.email ?? '未绑定'),
  brief: computed(() => userStore.profile?.brief ?? '未设置'),
})
const editData = reactive({
  avatar: '',
  header_background: '',
  nickname: '',
  email: '',
  brief: '',
  oldPassword: '',
  newPassword: ''
})
const updatingStates = reactive({
  avatar: false,
  header_background: false,
  nickname: false,
  email: false,
  brief: false,
  status: false,
})
const uploadingStates = reactive({
  avatar: false,
  header_background: false,
})
function getProfileUploadUrl() {
  return defaultStore.configs.upload_method === '1' ? '/upload/profile/s3' : '/upload/profile'
}

async function handleProfileImageUpload(key: 'avatar' | 'header_background', event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    messageStore.show('请选择图片文件', 'info', 2000)
    return
  }

  const formData = new FormData()
  formData.append('files', file)
  const id = messageStore.show('正在上传图片', 'loading')
  try {
    uploadingStates[key] = true
    const response = await uploadFiles(formData, getProfileUploadUrl())
    const url = response.data?.paths?.[0]
    if (!url) throw new Error('未获取到上传地址')
    editData[key] = url
    messageStore.update(id, { text: '上传成功，请确认后更新', type: 'success', duration: 2000 })
  } catch (error) {
    console.error('上传用户资料图片失败', error)
    messageStore.update(id, { text: '上传失败，请稍后重试', type: 'error', duration: 2000 })
  } finally {
    uploadingStates[key] = false
  }
}

// 更新信息
type EditableProfileKey = 'avatar' | 'header_background' | 'nickname' | 'email' | 'brief'
async function haldleUpdate(key: EditableProfileKey, value: string) {
  if (updatingStates[key]) {
    return
  }

  if (value === userData[key]) {
    messageStore.show('内容未作修改', 'info', 2000)
    return
  }
  if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    messageStore.show('邮箱格式不正确', 'info', 2000)
    return
  }
  if (needCaptcha.value && !captchaProof.value) {
    messageStore.show('请先完成人机验证', 'info', 2000)
    return
  }
  const dataToUpdate = { [key]: value, captchaProof: captchaProof.value }
  const id = messageStore.show(`正在修改中`, 'loading')
  try {
    updatingStates[key] = true
    await updateUserInfo(dataToUpdate)
    clearCaptcha()
    await userStore.fetchUserProfile()
    messageStore.update(id, { text: '更新成功', type: 'success', duration: 2000 })
    if (key in states) {
      states[key] = false
    }
  } catch (error) {
    clearCaptcha()
    console.error('更新信息失败，请稍后重试', error);
    messageStore.update(id, { text: '更新信息失败，请稍后重试', type: 'error', duration: 2000 })
  } finally {
    updatingStates[key] = false
    setTimeout(() => {
      messageStore.close(id)
    }, 2000);
  }
}
const haldleUpdatePassword = async (data: updatePasswordData) => {
  if (needCaptcha.value && !captchaProof.value) {
    messageStore.show('请先完成人机验证', 'info', 2000)
    return
  }
  const id = messageStore.show('正在更新密码', 'loading')
  try {
    const res = await changePassword({ ...data, captchaProof: captchaProof.value })
    clearCaptcha()
    if (res.data.status) {
      messageStore.update(id, { 'text': '更新密码成功', 'type': 'success', 'duration': 2000 })
    } else {
      messageStore.update(id, { 'text': '更新密码失败', 'type': 'error', 'duration': 2000 })
    }
  } catch (error) {
    clearCaptcha()
    if (isAxiosError(error) && error.response) {
        messageStore.update(id, { 'text': `${error.response.data.message}`, 'type': 'error', 'duration': 2000 });
    } else {
        messageStore.update(id, { 'text': '发生未知错误', 'type': 'error', 'duration': 2000 });
    }
  }
}
async function fetchOAuthAccounts() {
  try {
    const res = await getOAuthAccounts()
    oauthAccounts.value = res.data
  } catch (error) {
    console.error('获取第三方账号绑定失败', error)
  }
}

function oauthLoginUrl(path: string) {
  return `${getApiBaseUrl()}${path}`
}

function startOAuthBind(provider: 'linux_do' | 'nodeloc' | 'rainbow' | 'google' | 'github', type?: string) {
  const path = provider === 'linux_do'
    ? '/auth/oauth/linux-do/login?redirect=1'
    : provider === 'nodeloc'
      ? '/auth/oauth/nodeloc/login?redirect=1'
      : provider === 'google'
        ? '/auth/oauth/google/login?redirect=1'
        : provider === 'github'
          ? '/auth/oauth/github/login?redirect=1'
          : `/auth/oauth/rainbow/${encodeURIComponent(type || '')}/login?redirect=1`
  sessionStorage.setItem('moments_oauth_return_path', `${window.location.pathname}${window.location.search}${window.location.hash}` || '/profile')
  sessionStorage.setItem('moments_oauth_bind_current', '1')
  window.location.href = oauthLoginUrl(path)
}

const hasLinuxDo = computed(() => oauthAccounts.value.some(account => account.provider === 'linux_do'))
const hasNodeloc = computed(() => oauthAccounts.value.some(account => account.provider === 'nodeloc'))
const hasGoogle = computed(() => oauthAccounts.value.some(account => account.provider === 'google'))
const hasGithub = computed(() => oauthAccounts.value.some(account => account.provider === 'github'))
function hasRainbowType(type: string) {
  return oauthAccounts.value.some(account => account.provider === 'rainbow' && account.providerType === type)
}
const rainbowTypes = computed(() => String(defaultStore.configs.rainbow_oauth2_type || '').split(',').map(item => item.trim()).filter(Boolean))
function oauthDisplayName(account: OAuthAccount) {
  if (account.provider === 'linux_do') return 'Linux.Do'
  if (account.provider === 'nodeloc') return 'NodeLoc'
  if (account.provider === 'google') return 'Google'
  if (account.provider === 'github') return 'GitHub'
  if (account.provider === 'rainbow') return `${(account.providerType || '彩虹').toUpperCase()} 登录`
  return account.provider
}
function oauthAccountIcon(account: OAuthAccount) {
  if (account.provider === 'linux_do') return '/img/linux_do.png'
  if (account.provider === 'nodeloc') return '/img/nodeloc.png'
  if (account.provider === 'google') return '/img/google.svg'
  if (account.provider === 'github') return '/img/github.svg'
  if (account.provider === 'rainbow' && ['qq', 'wx', 'alipay'].includes(account.providerType || '')) {
    return `/img/${account.providerType}.svg`
  }
  return ''
}

function handleLogout() {
  userStore.handleLogout()
  messageStore.show('已退出登录', 'success', 2000)
  router.replace('/')
}

onMounted(async () => {
  await defaultStore.getPublicConfig()
  await fetchOAuthAccounts()
  window.addEventListener('moments-oauth-bound', fetchOAuthAccounts)
})

onUnmounted(() => {
  window.removeEventListener('moments-oauth-bound', fetchOAuthAccounts)
})
</script>

<template>
  <div class="container">
    <div class="header">
      <div id="back" @click="router.back()">
        <Icon>
          <ChevronLeft />
        </Icon>
      </div>
      <div>用户资料</div>
    </div>
    <div class="body">
      <div class="captcha-wrap" v-if="needCaptcha">
        <Captcha ref="captchaRef" @verified="onCaptchaVerified" />
      </div>

      <div class="body-item" @click="editData.avatar = userData.avatar; states.avatar = !states.avatar;">
        <div class="body-item-left">头像</div>
        <div class="body-item-right">
          <AvatarImage :src="userData.avatar" alt="avatar" style="width: 35px;" />
          <Icon :class="['icon', { 'rotate-icon': states.avatar }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.avatar" class="input profile-image-input">
        <input type="text" placeholder="请输入 新头像url" v-model="editData.avatar">
        <label class="upload-label">
          上传
          <input type="file" accept="image/*" @change="handleProfileImageUpload('avatar', $event)">
        </label>
        <button @click="haldleUpdate('avatar', editData.avatar)">更新</button>
      </div>

      <div class="body-item"
        @click="editData.header_background = userData.header_background; states.header_background = !states.header_background">
        <div class="body-item-left">背景</div>
        <div class="body-item-right">
          <img :src="userData.header_background" alt="不支持视频" style="width: 60px;">
          <Icon :class="['icon', { 'rotate-icon': states.avatar }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.header_background" class="input profile-image-input">
        <input type="text" placeholder="请输入 新背景url" v-model="editData.header_background">
        <label class="upload-label">
          上传
          <input type="file" accept="image/*" @change="handleProfileImageUpload('header_background', $event)">
        </label>
        <button @click="haldleUpdate('header_background', editData.header_background)">更新</button>
      </div>

      <div class="body-item" @click="states.role = !states.role">
        <div class="body-item-left">角色</div>
        <div class="body-item-right">
          {{ userData.role }}
          <Icon :class="['icon', { 'rotate-icon': states.role }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.role" class="input">
        <input type="text" placeholder="请输入 角色" readonly v-model="userData.username" style="color: #00000098;">
        <button style="background: #00000098;">不可更改</button>
      </div>

      <div class="body-item" @click="states.status = !states.status">
        <div class="body-item-left">状态</div>
        <div class="body-item-right">
          {{ userData.status }}
          <Icon :class="['icon', { 'rotate-icon': states.status }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.status" class="input">
        <input type="text" placeholder="请输入 状态码" readonly v-model="userData.status" style="color: #00000098;">
        <button style="background: #00000098;">不可更改</button>
      </div>

      <div class="body-item" @click="editData.nickname = userData.nickname; states.nickname = !states.nickname">
        <div class="body-item-left">昵称</div>
        <div class="body-item-right">
          {{ userData.nickname }}
          <Icon :class="['icon', { 'rotate-icon': states.nickname }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.nickname" class="input">
        <input type="text" placeholder="请输入 新昵称" v-model="editData.nickname">
        <button @click="haldleUpdate('nickname', editData.nickname)">更新</button>
      </div>

      <div class="body-item" @click="states.username = !states.username">
        <div class="body-item-left">账号</div>
        <div class="body-item-right">
          {{ userData.username }}
          <Icon :class="['icon', { 'rotate-icon': states.username }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.username" class="input">
        <input type="text" placeholder="请输入 用户名" readonly v-model="userData.username" style="color: #00000098;">
        <button style="background: #00000098;">不可更改</button>
      </div>

      <div class="body-item" @click="states.password = !states.password">
        <div class="body-item-left">密码</div>
        <div class="body-item-right">
          <span>需提供新旧密码</span>
          <Icon :class="['icon', { 'rotate-icon': states.password }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.password" class="input">
        <input type="text" placeholder="请输入 旧密码" v-model="editData.oldPassword">
        <input type="text" placeholder="请输入 新密码" v-model="editData.newPassword">
        <button
          @click="haldleUpdatePassword({ oldPassword: editData.oldPassword, newPassword: editData.newPassword })">更新</button>
      </div>

      <div class="body-item" @click="editData.email = userData.email; states.email = !states.email">
        <div class="body-item-left">邮箱</div>
        <div class="body-item-right">
          {{ userData.email }}
          <Icon :class="['icon', { 'rotate-icon': states.email }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.email" class="input">
        <input type="text" placeholder="请输入 邮箱" v-model="editData.email">
        <button @click="haldleUpdate('email', editData.email)">更新</button>
      </div>

      <div class="body-item" @click="editData.brief = userData.brief; states.brief = !states.brief">
        <div class="body-item-left">签名</div>
        <div class="body-item-right">
          {{ userData.brief }}
          <Icon :class="['icon', { 'rotate-icon': states.brief }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.brief" class="input">
        <input type="text" placeholder="请输入 签名" v-model="editData.brief">
        <button @click="haldleUpdate('brief', editData.brief)">更新</button>
      </div>

      <div class="body-item" @click="states.oauth = !states.oauth">
        <div class="body-item-left">第三方登录</div>
        <div class="body-item-right">
          <span>{{ oauthAccounts.length ? `已绑定 ${oauthAccounts.length} 个` : '未绑定' }}</span>
          <Icon :class="['icon', { 'rotate-icon': states.oauth }]">
            <ChevronRight />
          </Icon>
        </div>
      </div>
      <div v-if="states.oauth" class="oauth-panel">
        <div v-if="oauthAccounts.length" class="oauth-list">
          <div v-for="account in oauthAccounts" :key="account.id" class="oauth-account">
            <span class="oauth-account-name">
              <img v-if="oauthAccountIcon(account)" :src="oauthAccountIcon(account)" alt="">
              {{ oauthDisplayName(account) }}
            </span>
            <small>{{ account.nickname || account.email || '已绑定' }}</small>
          </div>
        </div>
        <div v-else class="oauth-empty">暂未绑定第三方账号</div>
        <div class="oauth-actions">
          <button
            v-if="defaultStore.configs.linux_do_oauth2 === '1' && !hasLinuxDo"
            class="oauth-bind-btn"
            @click="startOAuthBind('linux_do')"
          >
            <img :src="'/img/linux_do.png'" alt="">绑定 Linux.Do
          </button>
          <button
            v-if="defaultStore.configs.nodeloc_oauth2 === '1' && !hasNodeloc"
            class="oauth-bind-btn"
            @click="startOAuthBind('nodeloc')"
          >
            <img :src="'/img/nodeloc.png'" alt="">绑定 NodeLoc
          </button>
          <button
            v-if="defaultStore.configs.google_oauth2 === '1' && !hasGoogle"
            class="oauth-bind-btn"
            @click="startOAuthBind('google')"
          >
            <img :src="'/img/google.svg'" alt="">绑定 Google
          </button>
          <button
            v-if="defaultStore.configs.github_oauth2 === '1' && !hasGithub"
            class="oauth-bind-btn"
            @click="startOAuthBind('github')"
          >
            <img :src="'/img/github.svg'" alt="">绑定 GitHub
          </button>
          <template v-if="defaultStore.configs.rainbow_oauth2 === '1'">
            <button
              v-for="type in rainbowTypes"
              v-show="!hasRainbowType(type)"
              :key="type"
              class="oauth-bind-btn"
              @click="startOAuthBind('rainbow', type)"
            >
              <img v-if="['qq', 'wx', 'alipay'].includes(type)" :src="`/img/${type}.svg`" alt="">
              绑定 {{ type.toUpperCase() }}
            </button>
          </template>
        </div>
      </div>

      <div class="body-backend" v-if="userStore.profile?.role == '1'" @click="router.push({name: 'admin'})">
        <div>进入后台</div>
      </div>
      <div class="body-logout" @click="handleLogout">
        <div>退出登录</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: var(--color-bg-app);
}

/* 头部栏 */
.header {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 6vh;
  color: var(--color-text-primary);
  background-color: var(--color-post-bar);
  padding: 0px 5px 0px 10px;
  gap: 10px;
}

#back {
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
}

#back:hover {
  color: #000000fb;
  background: #f0f0f08b;
  cursor: pointer;
  border-radius: 10px;
}

/* 主体 */
.body {
  display: flex;
  flex-direction: column;
  /* width: min(100%,520px); */
  width: 100%;
}

.captcha-wrap {
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-border);
}

.body-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 0.6px 0 0 #cccccc62;
  padding: 10px 0 10px 0;
  /* color: #000000cd; */
  font-size: small;
}

.body-item-left {
  margin-left: 20px;
}

.body-item-right {
  margin-right: 10px;
  display: flex;
  align-items: center;
  color: var(--color-profile-item-right);
}

.body-item-right:hover {
  cursor: pointer;
}

.body-item-left:hover {
  cursor: pointer;
}

.oauth-panel {
  padding: 10px 20px 12px;
  box-shadow: 0 0.6px 0 0 #cccccc62;
}

.oauth-list {
  display: grid;
  gap: 8px;
  margin-bottom: 10px;
}

.oauth-account {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 5px;
  background: var(--color-ad);
  font-size: 13px;
}

.oauth-account-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.oauth-account-name img {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
}

.oauth-account small,
.oauth-empty {
  color: var(--color-profile-item-right);
  font-size: 12px;
}

.oauth-empty {
  margin-bottom: 10px;
}

.oauth-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.oauth-bind-btn {
  align-self: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 6px 10px;
  color: var(--color-text-primary);
  background: var(--color-ad);
  font-size: 12px;
}

.oauth-bind-btn img {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
}

.oauth-bind-btn:hover {
  color: #fff;
  background: #6cadf1;
}

.body-logout, .body-backend {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5px;
  font: small;
}
.body-logout {
  box-shadow: 0 -10px 0 0 #cccccc62;
  border-bottom: 1px solid #cccccc62;
  margin-top: 10px;
}

.body-logout:hover, .body-backend:hover {
  color: #d0c2c2;
}

/* 修改信息输入框 */
.input {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

input {
  border: none;
  outline: none;
  padding: 5px;
  margin-left: 15px;
  margin-bottom: 5px;
  margin-top: 5px;
  color: #338ae7;
  background-color: inherit;
  width: 75%;
  border-radius: 3px;
}

button {
  align-self: flex-end;
  margin-top: 5px;
  margin-bottom: 5px;
  margin-right: 15px;
  color: white;
  background: #09C362;
  border-radius: 5px;
  border: none;
  padding: 5px 15px;
}

button:hover {
  background: #f8bc99;
}

.profile-image-input {
  gap: 8px;
  padding-right: 15px;
}

.profile-image-input input[type="text"] {
  flex: 1 1 auto;
  min-width: 0;
  width: auto;
}

.profile-image-input button,
.upload-label {
  flex: 0 0 54px;
  width: 54px;
  min-height: 28px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  margin: 5px 0;
  padding: 4px 0;
  border-radius: 5px;
  white-space: nowrap;
  font-size: 12px;
  line-height: 1;
}

.upload-label {
  color: #fff;
  background: #6cadf1;
}

.upload-label:hover {
  cursor: pointer;
  background: #f8bc99;
}

.upload-label input {
  display: none;
}

.icon {
  padding: 5px 0 5px 0;
  margin-left: 5px;
  line-height: 1;
  font-size: 10px;
}

.rotate-icon {
  transition: transform 0.3s ease;
  transform: rotate(90deg);
}
</style>
