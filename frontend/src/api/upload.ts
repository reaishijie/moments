import type { AxiosRequestConfig } from "axios"
import service from "./request"
// 目前支持 本地上传 和 s3协议 上传
export function upload() {
    return service({
        url: '/upload',
        method: 'post',
        headers: {
            "Content-Type": 'multipart/form-data'
        }
    })
}
export function uploadS3() {
    return service({
        url: '/upload/s3',
        method: 'post',
        headers: {
            "Content-Type": 'multipart/form-data'
        }
    })
}

export function uploadFiles(
    formData: FormData,
    uploadUrl: string,
    onUploadProgress?: (progressEvent: any) => void
) {
    // console.log('@uploadUrl:', uploadUrl);
    
    const config: AxiosRequestConfig = {
        url: `${uploadUrl}`,
        method: 'post',
        data: formData,
        timeout: 120 * 1000,
        // axios 在 data 是 FormData 时会自动设置正确的 Content-Type（包含 boundary）
        headers: {},
        // 传输进度回调
        onUploadProgress: onUploadProgress,
    }
    return service(config);
}