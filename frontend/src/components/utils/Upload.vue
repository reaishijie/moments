<script setup lang="ts" name="Upload">
import { ref, watch, computed } from 'vue';
import { uploadFiles as apiUploadFiles } from '@/api/upload';
import { useMessageStore } from '@/store/message';
import { useDefaultStore } from '@/store/default';
import Media from '@/components/article/Media.vue';
import type { articleImageItem, articleVideoItem } from '@/types/article';
const apiUrl = import.meta.env.VITE_API_BASE_URL
console.log('@',apiUrl);
if(apiUrl.startsWith('http')) {
    console.log();
    
}


const props = withDefaults(defineProps<{
    articleType?: number
    uploadRole?: 'media' | 'video' | 'cover'
}>(), {
    articleType: 0,
    uploadRole: 'media'
})

const messageStore = useMessageStore()
const defaultStore = useDefaultStore()

// --- 响应式状态定义 ---
interface SelectedFile {
    file: File;
    previewUrl: string;
}
const selectedFiles = ref<SelectedFile[]>([]);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadedUrls = ref<string[]>([]); // 返回的图片、视频链接 数组
const errorMessage = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);
const msgId = ref()
const uploadUrl = ref()

if (defaultStore.configs.upload_method === '0') {
    uploadUrl.value = '/upload'
} else if (defaultStore.configs.upload_method === '1') {
    uploadUrl.value = '/upload/s3'
} else {
    // 默认使用本地上传
    uploadUrl.value = '/upload'
}

/**
 * 当用户选择文件时触发
 */
const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files) return;
    // 为已选择的文件创建特征Set合集
    const existingFileSignatures = new Set(
        selectedFiles.value.map(item => `${item.file.name}_${item.file.size}`)
    );
    // 新选择的文件
    const newlySelectedFiles = Array.from(target.files);
    // 符合要求的新文件
    const newFiles: { file: File, previewUrl: string }[] = [];
    // 遍历每一个新文件，选择出符合要求的文件放入 newFiles 中
    for (const file of newlySelectedFiles) {
        const signature = `${file.name}_${file.size}`;
        
        // 检查文件是否已存在
        if (existingFileSignatures.has(signature)) {
            messageStore.show(`已经选择过该文件${file.name}`, 'info', 2000)
            // 提醒过后继续处理其他文件
            continue
        }

        // 添加新的唯一文件，并更新已存在签名集合
        newFiles.push({
            file,
            previewUrl: URL.createObjectURL(file)
        });
        existingFileSignatures.add(signature); // 防止本次选择中也包含重复文件
    }


    // 合并已有的和新的不重复文件
    const merged = [...selectedFiles.value, ...newFiles];

    // 数量检查
    const maxFileCount = props.uploadRole === 'media' ? Number(defaultStore.configs.upload_number) : 1
    if (merged.length > maxFileCount) {
        return messageStore.show(`最多只能选择 ${maxFileCount} 个文件`, 'error', 4000)
    }

    // 类型检查
    const invalidType = merged.find(
        i => !i.file.type.startsWith('image/') && !i.file.type.startsWith('video/')
    );
    if (invalidType) {
        selectedFiles.value = []
        return messageStore.show(`只能上传图片/视频`, 'error', 4000)
    }
    if (props.uploadRole === 'video' && merged.some(i => !i.file.type.startsWith('video/'))) {
        selectedFiles.value = []
        return messageStore.show('这里只能上传视频文件', 'error', 4000)
    }
    if (props.uploadRole === 'cover' && merged.some(i => !i.file.type.startsWith('image/'))) {
        selectedFiles.value = []
        return messageStore.show('这里只能上传封面图片', 'error', 4000)
    }

    // 大小检查
    const tooBig = merged.find(
        i => i.file.size / 1024 / 1024 > Number(defaultStore.configs.upload_size)
    );
    if (tooBig) {
        selectedFiles.value = []
        return messageStore.show(`文件大小不能超过 ${defaultStore.configs.upload_size} M`, 'error', 4000)
    }

    selectedFiles.value = merged;

    messageStore.show('文件选择成功', 'success', 2000)
    uploadedUrls.value = [];
    errorMessage.value = '';
    uploadProgress.value = 0;
};

/**
 * 执行上传操作
 */
const performUpload = async (articleId: string) => {
    if (selectedFiles.value.length === 0) {
        messageStore.show('请先选择文件！', 'info', 2000)
        return;
    }
    // --- 1. 准备阶段：重置状态并构建数据 ---
    isUploading.value = true;
    uploadProgress.value = 0;
    errorMessage.value = '';
    uploadedUrls.value = [];
    // ⭐⭐⭐
    const formData = new FormData();
    selectedFiles.value.forEach(item => {
        formData.append('files', item.file);
    });

    formData.append('articleId', articleId)
    formData.append('articleType', String(props.articleType))
    formData.append('uploadRole', props.uploadRole)

    // 定义用于更新进度的回调函数
    const progressCallback = (progressEvent: any) => {
        if (progressEvent.total) {
            uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        }
    };

    try {
        // --- 2. 调用 API：执行上传 ---
        msgId.value = messageStore.show('开始上传文件...', 'loading')
        const response = await apiUploadFiles(formData, uploadUrl.value, progressCallback);
        messageStore.update(msgId.value, { type: 'success', text: '上传成功', duration: 2000 })

        // --- 3. 成功处理：更新界面 ---
        uploadedUrls.value = response.data.paths;

    } catch (error: any) {
        // --- 4. 失败处理：显示错误信息 ---
        console.error('上传失败:', error);
        if (error.response) {
            errorMessage.value = error.response.data.message || '发生未知服务端错误';
        } else {
            errorMessage.value = error.message || '网络请求失败';
        }
    } finally {
        // --- 5. 清理阶段：重置状态 ---
        isUploading.value = false;
        selectedFiles.value = [];
        // 清空原生 input 的值，允许用户重复上传同一个文件
        if (fileInputRef.value) {
            fileInputRef.value.value = '';
        }
    }
};
watch(errorMessage, (newVal) => {
    if (newVal) {
        messageStore.update(msgId.value, { type: 'error', text: newVal, duration: 4000 })
    }
})

const previewImages = computed<articleImageItem[]>(() =>
    selectedFiles.value
        .filter(i => i.file.type.startsWith('image/'))
        .map((i, idx) => ({
            id: String(idx), // 随便给个唯一 id
            image_url: i.previewUrl,
        }))
)

const previewVideos = computed<articleVideoItem[]>(() =>
    selectedFiles.value
        .filter(i => i.file.type.startsWith('video/'))
        .map((i, idx) => ({
            id: String(idx),
            video_url: i.previewUrl,
            thumbnail_url: '',
        }))
)
const inputAccept = computed(() => {
    if (props.uploadRole === 'video') return 'video/*'
    if (props.uploadRole === 'cover') return 'image/*'
    return 'image/*,video/*'
})

function handleImagesUpdate(newOrderedImages: articleImageItem[]) {
    // `newOrderedImages` 是 Media 组件排序后返回的图片数组。
    // 我们的目标是根据这个新顺序，来重新排列 `selectedFiles`。

    // 提取出新顺序的 URL 列表顺序
    const orderedUrls = newOrderedImages.map(img => img.image_url);

    //  提取出原始数组中的图片和视频
    const imageFiles = selectedFiles.value.filter(sf => sf.file.type.startsWith('image/'));
    const videoFiles = selectedFiles.value.filter(sf => sf.file.type.startsWith('video/'));

    // 根据 URL 列表，对图片文件进行排序
    imageFiles.sort((a, b) => {
        return orderedUrls.indexOf(a.previewUrl) - orderedUrls.indexOf(b.previewUrl);
    });

    selectedFiles.value = [...imageFiles, ...videoFiles];
}
function clickAddFile() {
    if (isUploading.value) {
        messageStore.show('请等待文件上传完成再操作', 'info', 2000)
    } else {
        fileInputRef.value?.click()
    }
}
function handleRemoveImage(index: number) {
    const imageFiles = selectedFiles.value.filter(sf => sf.file.type.startsWith('image/'));
    const target = imageFiles[index];
    if (!target) return;
    selectedFiles.value = selectedFiles.value.filter(sf => sf !== target);
}
function hasSelectedFiles() {
    return selectedFiles.value.length > 0;
}
function hasSelectedVideo() {
    return selectedFiles.value.some(sf => sf.file.type.startsWith('video/'));
}

defineExpose({ performUpload, hasSelectedFiles, hasSelectedVideo });
</script>

<template>
    <div class="upload-container">

        <Media :article-images="previewImages" :article-videos="previewVideos" :upload="true"
            :upload-number="defaultStore.configs.upload_number" @remove:image="handleRemoveImage"
            @update:articleImages="handleImagesUpdate" @add:file="clickAddFile">
        </Media>

        <input type="file" :multiple="props.uploadRole === 'media'" @change="handleFileChange" ref="fileInputRef"
            :disabled="isUploading" class="file-input" :accept="inputAccept" />

        <!-- 上传按钮 -->
        <!-- <div class="upload-actions">
      <button @click="performUpload" :disabled="isUploading || selectedFiles.length === 0">
        {{ isUploading ? `上传中... ${uploadProgress}%` : '开始上传' }}
      </button>
    </div> -->
    </div>
</template>


<style scoped>
.upload-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    width: 100%;
    margin: 5px;
}

/* 隐藏默认样式 */
.file-input {
    display: none;
}
</style>