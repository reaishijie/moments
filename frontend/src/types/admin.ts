/**
 * 每次数据库config增加键值必须增加此处值
 * @example: keyname?: string
 */
export interface updateConfigData {
    // 网站配置
    sitename?: string,
    site_url?: string,
    site_email?: string,
    site_logo?: string,
    site_font?: string,
    site_keywords?: string,
    site_header_background?: string,
    site_description?: string,
    site_brief?: string,
    site_background?: string,
    site_avatar?: string,
    site_footer_html?: string,
    site_left_corner_html?: string,
    site_right_corner_html?: string,
    site_stat_enabled?: string,
    site_stat_script_url?: string,
    site_stat_site_id?: string,
    // 邮箱配置
    mail_user?: string,
    mail_secure?: string,
    mail_port?: string,
    mail_pass?: string,
    mail_host?: string,
    // 用户配置
    user_status? : string,
    user_auth?: string,
    // 0为关闭 | 1为hcaptcha验证
    user_captcha?: string,
    user_captcha_article?: string,
    user_captcha_comment?: string,
    user_captcha_update?: string,
    user_email_verify_register?: string,
    verify_hcaptcha_user?: string,
    verify_hcaptcha_app?: string,
    location_method?: string,
    // 文件上传
    upload_method?: string,
    upload_number?: string
    upload_size?: string,
    upload_s3_bucketname?: string,
    upload_s3_domain?: string,
    upload_s3_endpoint?: string,
    upload_s3_id?: string,
    upload_s3_region?: string,
    upload_s3_secret?: string,
    link_brief?: string,
}

export type ConfigAccessLevel = 'public' | 'user' | 'admin';

export interface ConfigQueryParams {
    key?: string;
    keys?: string;
    category?: string;
    categories?: string;
    accessLevel?: ConfigAccessLevel | ConfigAccessLevel[];
    detail?: boolean | 1 | '1' | 'true';
}

export interface ConfigDetail {
    key: string;
    value: string;
    name: string;
    description: string;
    category: string;
    sort: number;
    accessLevel: ConfigAccessLevel;
}
