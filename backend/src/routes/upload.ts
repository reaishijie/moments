import { Router, Request, Response } from "express"
import multer from 'multer'
import { S3Client } from "@aws-sdk/client-s3"
import multerS3 from 'multer-s3'
import path from "path"
import { nanoid } from "nanoid"
import { FileService, publicRootPath } from "../services/file.service.js"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { PrismaClient } from "@prisma/client";
import { CONFIG_CACHE } from "../services/config.service.js"
import { error } from "console"

const configs = CONFIG_CACHE
const prisma = new PrismaClient()
const router = Router()

/**
 * @description：本地存储
 * @default：可设置文件大小、上传数量、上传目录、文件名格式
 * @feature ：fileSize 、 fileNumber S3配置 放入数据库中
 */
// 文件大小 byte
const fileSize = Number(configs.upload_size) * 1024 * 1024
// 文件数量
const fileNumber = Number(configs.upload_number)
// 允许上传的图片类型
const allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'image/avif'
];
// 允许上传的视频类型
const allowedVideoTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime' // .mov 文件的常见MIME类型
];
// 允许上传的文件类型合集
const allowType = [...allowedImageTypes, ...allowedVideoTypes]
// 定义multer的存储
const storage = multer.diskStorage({
    // 储存的目标文件
    destination: async function (req, file, cb) {
        try {
            const date = new Date();
            const year = date.getFullYear().toString();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            // 生成新文件路径名 日期 + nanoid + 原文件名
            const currentFolderPath = path.join(publicRootPath, 'upload', year, month);

            await FileService.checkAndMakeFolder(currentFolderPath)
            cb(null, currentFolderPath); // 控制存储目录
        } catch (error) {
            cb(error as Error, '');
        }
    },
    // 存储的文件名
    filename: function (req, file, cb) {
        try {
            const date = new Date();
            const day = date.getDate().toString();
            const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '');
            const uniqueFilename = day + '_' + nanoid(5) + '_' + safeOriginalName;
            // 控制文件名，例如：保留原始文件名
            cb(null, uniqueFilename);
        } catch (error) {
            cb(error as Error, '');
        }
    }
});
// 允许上传文件类型过滤器
const mediaFilter = (req: Request, file: Express.Multer.File, cb: Function) => {
    const fileType = file.mimetype
    if (allowType.includes(fileType)) {
        cb(null, true)
    } else {
        cb(new Error('不支持的文件类型! 仅支持图片和视频。'), false);
    }
}
// 构建中间件
const upload = multer({
    storage,
    // 限制单个文件大小
    limits: {
        fileSize,
    },
    // 文件类型过滤
    fileFilter: mediaFilter
})


// 普通文件上传
router.post('/', authMiddleware, upload.array('files', fileNumber), async (req: Request, res: Response) => {
    // 上传文件信息
    // console.log(req.files);
    const articleId = req.body.articleId;
    const files = req.files as Express.Multer.File[]
    try {
        if (!files || files.length === 0) {
            return res.status(400).json({ status: false, message: '缺少文件' })
        }

        // 串行 内存⛔
        // const filePaths: string[] = []
        // for (const file of files) {
        //     const filePath = await UploadService.uploadSmallFile(file.originalname, file.buffer);
        //     filePaths.push(filePath);
        // }

        // 并行 使用磁盘 防止内存爆炸⛔
        // const uploadPromises = files.map(file =>
        //     UploadService.moveTemporaryFile(file)
        // )
        // const filePaths = await Promise.all(uploadPromises)

        const processPromises = files.map(async (file, index) => { 
            const relativePath = path.relative(publicRootPath, file.path);
            const urlPath = '/' + relativePath.split(path.sep).join('/');

            // 检查文件类型，如果是图片则写入数据库
            if (allowedImageTypes.includes(file.mimetype)) {
                try {
                    await prisma.article_images.create({
                        data: {
                            image_url: urlPath,
                            sort_order: index,
                            article_id: BigInt(articleId)
                        }
                    });
                } catch (error) {
                    // 记录错误但允许其他文件继续上传
                    console.error(`数据库写入图片 ${urlPath} 失败:`, error);
                }
            }
            if (allowedVideoTypes.includes(file.mimetype)) {
                try {
                    await prisma.article_videos.create({
                        data: {
                            video_url: urlPath,
                            sort_order: index
                        }
                    });
                } catch (error) {
                    // 记录错误但允许其他文件继续上传
                    console.error(`数据库写入视频 ${urlPath} 失败:`, error);
                }
            }
            // 总是返回文件路径，无论数据库写入是否成功
            return urlPath;
        });
        const filePaths = await Promise.all(processPromises);

        res.json({ status: true, message: `${filePaths.length}个文件上传成功`, paths: filePaths })
    } catch (error) {
        console.log('@上传多个文件时出错：', error);
        res.status(500).json({ status: false, message: '上传失败' })
    }
})

// S3文件上传
// 配置s3客户端

const s3 = new S3Client({
    // aws可为空， r2等兼容服务必须填写
    endpoint: configs.upload_s3_endpoint || undefined,
    // 区域
    region: configs.upload_s3_region || 'auto',
    // 凭证
    credentials: {
        accessKeyId: configs.upload_s3_id,
        secretAccessKey: configs.upload_s3_secret
    }
})
const s3Upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: configs.upload_s3_bucketname || "defaultName",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            try {
                const date = new Date()
                const year = date.getFullYear().toString()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = date.getDate().toString()
                const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '')
                const finalKey = `upload/${year}/${month}/${day}_${nanoid(5)}_${safeOriginalName}`;
                cb(null, finalKey);
            } catch (error) {
                cb(error as Error);
            }
        }
    }),
    limits: { fileSize },
    fileFilter: mediaFilter,
})

/** 
 * @description : 最初配置
router.post('/s3', authMiddleware, s3Upload.array('files', fileNumber), (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
        return res.status(400).json({ status: false, message: '没有文件被上传' });
    }
    const filePaths = files.map(file => {
        const fileKey = (file as any).key // file.key 是文件在 bucket 中的路径和文件名
        //如果配置了自定义域名，则拼接自定义URL；否则，使用S3/R2返回的默认 URL
        return configs.upload_s3_domain ? `https://${configs.upload_s3_domain}/${fileKey}` : (file as any).location
    })
    res.json({ status: true, message: `成功上传 ${filePaths.length} 个文件`, paths: filePaths })
})
*/

router.post('/s3', authMiddleware, s3Upload.array('files', fileNumber), async (req: Request, res: Response) => {

    const files = req.files as Express.Multer.File[];
    const articleId = req.body.articleId;
    console.log('@文章id',articleId);
    
    if (!files || files.length === 0) {
        return res.status(400).json({ status: false, message: '没有文件被上传' });
    }

    try {
        // 使用 map 创建一个 Promise 数组，处理数据库写入和 URL 格式化
        const processPromises = files.map(async (file, index) => {

            // 1. 获取上传信息
            // 假设 Multer S3 存储引擎将 key 和 location 附加到 file 对象上
            const fileKey = (file as any).key;
            const s3Location = (file as any).location;

            // 2. 使用 CONFIG_CACHE 格式化 URL
            // 访问已缓存的配置对象，这是瞬时内存读取
            const customDomain = CONFIG_CACHE.upload_s3_domain;

            const fileUrl = customDomain
                ? `https://${customDomain}/${fileKey}`
                : s3Location;

            if (allowedImageTypes.includes(file.mimetype)) {
                await prisma.article_images.create({
                    data: {
                        image_url: fileUrl,
                        sort_order: index,
                        article_id: BigInt(articleId)
                    }
                });
            }
            if (allowedVideoTypes.includes(file.mimetype)) {
                await prisma.article_videos.create({
                    data: {
                        video_url: fileUrl,
                        sort_order: index
                    }
                })
            }

            return fileUrl;
        });

        // 4. 等待所有文件处理和数据库写入完成
        const filePaths = await Promise.all(processPromises);

        // 5. 返回成功响应
        res.json({ status: true, message: `成功上传 ${filePaths.length} 个文件`, paths: filePaths });

    } catch (error) {
        console.error('@S3/R2 上传处理时出错：', error);
        res.status(500).json({ status: false, message: '文件处理失败' });
    }
});
export default router