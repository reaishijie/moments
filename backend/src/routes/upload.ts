import { Router, Request, Response } from "express"
import multer from 'multer'
import path from "path"
import { nanoid } from "nanoid"
import { FileService, publicRootPath } from "../services/file.service.js"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { prisma } from "../lib/prisma.js";
import { getConfigCache, type AppConfig } from "../services/config.service.js"
import { Logger } from "../utils/logger.js"

const router = Router()
const logger = new Logger('UploadRoute')

/**
 * @description：本地存储
 * @default：可设置文件大小、上传数量、上传目录、文件名格式
 * @feature ：fileSize 、 fileNumber S3配置 放入数据库中
 */
const DEFAULT_FILE_SIZE_MB = 5
const DEFAULT_FILE_NUMBER = 9

function getFileSize(configs: AppConfig) {
    return (Number(configs.upload_size) || DEFAULT_FILE_SIZE_MB) * 1024 * 1024
}

function getFileNumber(configs: AppConfig) {
    return Number(configs.upload_number) || DEFAULT_FILE_NUMBER
}

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
function createLocalUpload(configs: AppConfig) {
    return multer({
        storage,
        // 限制单个文件大小
        limits: {
            fileSize: getFileSize(configs),
        },
        // 文件类型过滤
        fileFilter: mediaFilter
    })
}

async function localUploadMiddleware(req: Request, res: Response, next: Function) {
    try {
        const configs = await getConfigCache()
        createLocalUpload(configs).array('files', getFileNumber(configs))(req, res, next as any)
    } catch (error) {
        next(error)
    }
}

// 普通文件上传
router.post('/', authMiddleware, localUploadMiddleware, async (req: Request, res: Response) => {
    // 上传文件信息
    // console.log(req.files);
    const articleId = req.body.articleId;
    const articleType = Number(req.body.articleType ?? 0);
    const uploadRole = req.body.uploadRole as string | undefined;
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

        const fileUrlMap = new Map<Express.Multer.File, string>();
        files.forEach(file => {
            const relativePath = path.relative(publicRootPath, file.path);
            fileUrlMap.set(file, '/' + relativePath.split(path.sep).join('/'));
        });
        const videoThumbnailUrl = articleType === 2
            ? fileUrlMap.get(files.find(file => allowedImageTypes.includes(file.mimetype)) as Express.Multer.File) || ''
            : '';
        let videoSortOrder = 0;

        const processPromises = files.map(async (file, index) => {
            const urlPath = fileUrlMap.get(file)!;

            if (allowedImageTypes.includes(file.mimetype) && articleType === 2 && uploadRole === 'cover') {
                try {
                    const video = await prisma.article_videos.findFirst({
                        where: { article_id: BigInt(articleId) },
                        orderBy: { sort_order: 'asc' }
                    });
                    if (video) {
                        await prisma.article_videos.update({
                            where: { id: video.id },
                            data: { thumbnail_url: urlPath }
                        });
                    }
                } catch (error) {
                    console.error(`数据库写入视频封面 ${urlPath} 失败:`, error);
                }
            } else if (allowedImageTypes.includes(file.mimetype) && articleType !== 2) {
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
                            thumbnail_url: videoThumbnailUrl,
                            sort_order: videoSortOrder++,
                            article_id: BigInt(articleId)
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
// S3 相关依赖较重，按需动态加载，避免拖慢普通 pnpm dev 启动
async function createS3Upload(configs: AppConfig) {
    const [{ S3Client }, multerS3Module] = await Promise.all([
        import("@aws-sdk/client-s3"),
        import("multer-s3"),
    ])
    const multerS3 = multerS3Module.default

    const endpoint = configs.upload_s3_endpoint?.trim() || undefined
    const configuredRegion = configs.upload_s3_region?.trim()
    const region = endpoint ? (configuredRegion || 'auto') : (configuredRegion && configuredRegion !== 'auto' ? configuredRegion : 'us-east-1')

    if (!endpoint && configuredRegion === 'auto') {
        logger.warn('S3 region "auto" requires a custom endpoint. Falling back to "us-east-1" for AWS S3.')
    }

    const s3 = new S3Client({
        // aws可为空， r2等兼容服务必须填写
        endpoint,
        // 区域：R2 等兼容服务常用 auto；AWS S3 不能使用 auto
        region,
        // 凭证
        credentials: {
            accessKeyId: configs.upload_s3_id,
            secretAccessKey: configs.upload_s3_secret
        }
    })

    return multer({
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
        limits: { fileSize: getFileSize(configs) },
        fileFilter: mediaFilter,
    })
}

async function s3UploadMiddleware(req: Request, res: Response, next: Function) {
    try {
        const configs = await getConfigCache()
        const upload = await createS3Upload(configs)
        upload.array('files', getFileNumber(configs))(req, res, next as any)
    } catch (error) {
        next(error)
    }
}

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

router.post('/s3', authMiddleware, s3UploadMiddleware, async (req: Request, res: Response) => {

    const files = req.files as Express.Multer.File[];
    const articleId = req.body.articleId;
    const articleType = Number(req.body.articleType ?? 0);
    const uploadRole = req.body.uploadRole as string | undefined;
    logger.debug(`S3 upload article id: ${articleId}`)
    
    if (!files || files.length === 0) {
        return res.status(400).json({ status: false, message: '没有文件被上传' });
    }

    try {
        const configs = await getConfigCache();
        const getFileUrl = (file: Express.Multer.File) => {
            const fileKey = (file as any).key;
            const s3Location = (file as any).location;
            const customDomain = configs.upload_s3_domain;
            return customDomain ? `https://${customDomain}/${fileKey}` : s3Location;
        };
        const fileUrlMap = new Map<Express.Multer.File, string>();
        files.forEach(file => fileUrlMap.set(file, getFileUrl(file)));
        const videoThumbnailUrl = articleType === 2
            ? fileUrlMap.get(files.find(file => allowedImageTypes.includes(file.mimetype)) as Express.Multer.File) || ''
            : '';
        let videoSortOrder = 0;

        // 使用 map 创建一个 Promise 数组，处理数据库写入和 URL 格式化
        const processPromises = files.map(async (file, index) => {
            const fileUrl = fileUrlMap.get(file)!;

            if (allowedImageTypes.includes(file.mimetype) && articleType === 2 && uploadRole === 'cover') {
                const video = await prisma.article_videos.findFirst({
                    where: { article_id: BigInt(articleId) },
                    orderBy: { sort_order: 'asc' }
                });
                if (video) {
                    await prisma.article_videos.update({
                        where: { id: video.id },
                        data: { thumbnail_url: fileUrl }
                    });
                }
            } else if (allowedImageTypes.includes(file.mimetype) && articleType !== 2) {
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
                        thumbnail_url: videoThumbnailUrl,
                        sort_order: videoSortOrder++,
                        article_id: BigInt(articleId)
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
        logger.error('S3/R2 上传处理时出错', error instanceof Error ? error.stack : String(error));
        res.status(500).json({ status: false, message: '文件处理失败' });
    }
});
export default router