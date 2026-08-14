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
    // 0 为关闭，1 为开启
    user_captcha?: string,
    user_captcha_article?: string,
    user_captcha_comment?: string,
    user_captcha_update?: string,
    user_email_verify_register?: string,
    captcha_provider?: string,
    // OAuth 登录配置
    oauth2_redirect_uri?: string,
    rainbow_oauth2?: string,
    rainbow_oauth2_api_url?: string,
    rainbow_oauth2_appid?: string,
    rainbow_oauth2_appkey?: string,
    rainbow_oauth2_type?: string,
    linux_do_oauth2?: string,
    linux_do_client_id?: string,
    linux_do_client_secret?: string,
    nodeloc_oauth2?: string,
    nodeloc_url?: string,
    nodeloc_client_id?: string,
    nodeloc_client_secret?: string,
    google_oauth2?: string,
    google_client_id?: string,
    google_client_secret?: string,
    github_oauth2?: string,
    github_client_id?: string,
    github_client_secret?: string,
    verify_hcaptcha_user?: string,
    verify_hcaptcha_app?: string,
    verify_turnstile_site_key?: string,
    verify_turnstile_secret?: string,
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
