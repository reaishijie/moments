ALTER TABLE `config`
    ADD COLUMN `name` VARCHAR(100) NOT NULL DEFAULT '',
    ADD COLUMN `description` VARCHAR(255) NOT NULL DEFAULT '',
    ADD COLUMN `category` VARCHAR(50) NOT NULL DEFAULT 'system',
    ADD COLUMN `sort` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `access_level` VARCHAR(20) NOT NULL DEFAULT 'admin',
    ADD COLUMN `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

CREATE INDEX `config_access_level_category_sort_idx` ON `config`(`access_level`, `category`, `sort`);

UPDATE `config` SET
    `name` = CASE `k`
        WHEN 'sitename' THEN '网站名称'
        WHEN 'site_url' THEN '网站地址'
        WHEN 'site_email' THEN '管理员邮箱'
        WHEN 'site_keywords' THEN '站点关键词'
        WHEN 'site_description' THEN '站点描述'
        WHEN 'site_background' THEN '站点背景'
        WHEN 'site_logo' THEN '站点 Logo'
        WHEN 'site_font' THEN '自定义字体'
        WHEN 'site_header_background' THEN '首页头图'
        WHEN 'site_avatar' THEN '首页头像'
        WHEN 'site_brief' THEN '首页简介'
        WHEN 'mail_host' THEN 'SMTP 主机'
        WHEN 'mail_port' THEN 'SMTP 端口'
        WHEN 'mail_secure' THEN '安全连接'
        WHEN 'mail_user' THEN '邮箱账号'
        WHEN 'mail_pass' THEN '邮箱授权码'
        WHEN 'user_auth' THEN '注册审核'
        WHEN 'user_captcha' THEN '登录注册验证'
        WHEN 'user_captcha_article' THEN '发文验证'
        WHEN 'user_captcha_comment' THEN '评论验证'
        WHEN 'user_captcha_update' THEN '资料更新验证'
        WHEN 'user_status' THEN '用户系统状态'
        WHEN 'verify_hcaptcha_user' THEN 'hCaptcha Secret'
        WHEN 'verify_hcaptcha_app' THEN 'hCaptcha Site Key'
        WHEN 'upload_method' THEN '上传方式'
        WHEN 'upload_number' THEN '上传数量'
        WHEN 'upload_size' THEN '上传大小'
        WHEN 'upload_s3_endpoint' THEN 'S3 Endpoint'
        WHEN 'upload_s3_region' THEN 'S3 Region'
        WHEN 'upload_s3_bucketname' THEN 'S3 Bucket'
        WHEN 'upload_s3_id' THEN 'S3 Access Key'
        WHEN 'upload_s3_secret' THEN 'S3 Secret Key'
        WHEN 'upload_s3_domain' THEN 'S3 访问域名'
        WHEN 'location_method' THEN '位置服务'
        WHEN 'link_brief' THEN '友情链接简介'
        ELSE `name`
    END,
    `description` = CASE `k`
        WHEN 'sitename' THEN '用于页面标题和站点展示'
        WHEN 'site_url' THEN '站点公开访问地址'
        WHEN 'site_email' THEN '用于站点联系和通知展示'
        WHEN 'site_keywords' THEN '用于 SEO 的关键词'
        WHEN 'site_description' THEN '用于 SEO 和页面介绍'
        WHEN 'site_background' THEN '公共页面背景图片地址'
        WHEN 'site_logo' THEN '站点 Logo 图片地址'
        WHEN 'site_font' THEN '公共页面自定义字体配置'
        WHEN 'site_header_background' THEN '首页 Header 背景图片地址'
        WHEN 'site_avatar' THEN '首页头像图片地址'
        WHEN 'site_brief' THEN '首页个人简介文案'
        WHEN 'mail_host' THEN '发件邮箱 SMTP 服务地址'
        WHEN 'mail_port' THEN '发件邮箱 SMTP 服务端口'
        WHEN 'mail_secure' THEN '是否启用 SMTP 安全连接'
        WHEN 'mail_user' THEN '发件邮箱账号'
        WHEN 'mail_pass' THEN '发件邮箱授权码或密码'
        WHEN 'user_auth' THEN '是否开启用户注册审核'
        WHEN 'user_captcha' THEN '登录注册验证码开关'
        WHEN 'user_captcha_article' THEN '用户发表文章是否需要验证'
        WHEN 'user_captcha_comment' THEN '用户发表评论是否需要验证'
        WHEN 'user_captcha_update' THEN '用户更新信息是否需要验证'
        WHEN 'user_status' THEN '用户系统是否开放'
        WHEN 'verify_hcaptcha_user' THEN 'hCaptcha 服务端密钥'
        WHEN 'verify_hcaptcha_app' THEN 'hCaptcha 客户端站点 Key'
        WHEN 'upload_method' THEN '文件上传方式，0 为本地，1 为 S3'
        WHEN 'upload_number' THEN '单次最多上传文件数量'
        WHEN 'upload_size' THEN '单文件大小限制，单位 M'
        WHEN 'upload_s3_endpoint' THEN 'S3 或 R2 端点地址'
        WHEN 'upload_s3_region' THEN 'S3 或 R2 区域'
        WHEN 'upload_s3_bucketname' THEN 'S3 或 R2 存储桶名称'
        WHEN 'upload_s3_id' THEN 'S3 或 R2 Access Key ID'
        WHEN 'upload_s3_secret' THEN 'S3 或 R2 Secret Access Key'
        WHEN 'upload_s3_domain' THEN 'S3 或 R2 文件访问域名'
        WHEN 'location_method' THEN '位置信息接口类型，0 为 ping0'
        WHEN 'link_brief' THEN '友情链接页面顶部描述'
        ELSE `description`
    END,
    `category` = CASE
        WHEN `k` LIKE 'mail_%' THEN 'email'
        WHEN `k` LIKE 'verify_%' OR `k` LIKE '%captcha%' THEN 'verify'
        WHEN `k` LIKE 'user_%' THEN 'user'
        WHEN `k` LIKE 'upload_%' THEN 'upload'
        WHEN `k` LIKE 'location_%' THEN 'location'
        WHEN `k` LIKE 'link_%' THEN 'link'
        WHEN `k` LIKE 'site_%' OR `k` = 'sitename' THEN 'site'
        ELSE `category`
    END,
    `sort` = CASE `k`
        WHEN 'sitename' THEN 10
        WHEN 'site_url' THEN 20
        WHEN 'site_email' THEN 30
        WHEN 'site_keywords' THEN 40
        WHEN 'site_description' THEN 50
        WHEN 'site_background' THEN 60
        WHEN 'site_logo' THEN 70
        WHEN 'site_font' THEN 80
        WHEN 'site_header_background' THEN 90
        WHEN 'site_avatar' THEN 100
        WHEN 'site_brief' THEN 110
        WHEN 'mail_host' THEN 10
        WHEN 'mail_port' THEN 20
        WHEN 'mail_secure' THEN 30
        WHEN 'mail_user' THEN 40
        WHEN 'mail_pass' THEN 50
        WHEN 'user_auth' THEN 10
        WHEN 'user_status' THEN 20
        WHEN 'user_captcha' THEN 10
        WHEN 'user_captcha_article' THEN 20
        WHEN 'user_captcha_comment' THEN 30
        WHEN 'user_captcha_update' THEN 40
        WHEN 'verify_hcaptcha_user' THEN 50
        WHEN 'verify_hcaptcha_app' THEN 60
        WHEN 'upload_method' THEN 10
        WHEN 'upload_number' THEN 20
        WHEN 'upload_size' THEN 30
        WHEN 'upload_s3_endpoint' THEN 40
        WHEN 'upload_s3_region' THEN 50
        WHEN 'upload_s3_bucketname' THEN 60
        WHEN 'upload_s3_id' THEN 70
        WHEN 'upload_s3_secret' THEN 80
        WHEN 'upload_s3_domain' THEN 90
        WHEN 'location_method' THEN 10
        WHEN 'link_brief' THEN 10
        ELSE `sort`
    END,
    `access_level` = CASE
        WHEN `k` IN (
            'site_avatar',
            'site_background',
            'site_brief',
            'site_description',
            'site_font',
            'site_header_background',
            'site_keywords',
            'site_logo',
            'sitename',
            'verify_hcaptcha_app',
            'user_captcha',
            'user_status',
            'user_captcha_article',
            'user_captcha_comment',
            'user_captcha_update',
            'upload_method',
            'upload_number',
            'upload_size',
            'location_method',
            'link_brief'
        ) THEN 'public'
        ELSE 'admin'
    END;
