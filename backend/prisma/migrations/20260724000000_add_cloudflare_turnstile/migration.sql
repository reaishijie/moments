INSERT INTO `config` (`k`, `v`, `name`, `description`, `category`, `sort`, `access_level`)
VALUES
    ('captcha_provider', 'hcaptcha', '验证码提供商', '选择 hCaptcha 或 Cloudflare Turnstile', 'verify', 50, 'public'),
    ('verify_turnstile_site_key', '', 'Turnstile Site Key', 'Cloudflare Turnstile 客户端站点 Key', 'verify', 80, 'public'),
    ('verify_turnstile_secret', '', 'Turnstile Secret Key', 'Cloudflare Turnstile 服务端密钥', 'verify', 90, 'admin')
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `description` = VALUES(`description`),
    `category` = VALUES(`category`),
    `sort` = VALUES(`sort`),
    `access_level` = VALUES(`access_level`);

UPDATE `config`
SET `sort` = CASE `k`
    WHEN 'verify_hcaptcha_app' THEN 60
    WHEN 'verify_hcaptcha_user' THEN 70
    ELSE `sort`
END
WHERE `k` IN ('verify_hcaptcha_app', 'verify_hcaptcha_user');
