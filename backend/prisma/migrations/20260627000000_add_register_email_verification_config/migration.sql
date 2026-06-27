INSERT INTO `config` (`k`, `v`, `name`, `description`, `category`, `sort`, `access_level`)
VALUES ('user_email_verify_register', '0', '注册邮箱验证', '用户注册时是否必须通过邮箱验证码验证', 'verify', 45, 'public')
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `description` = VALUES(`description`),
    `category` = VALUES(`category`),
    `sort` = VALUES(`sort`),
    `access_level` = VALUES(`access_level`);
