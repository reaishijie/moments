INSERT INTO `config` (`k`, `v`, `name`, `description`, `category`, `sort`, `access_level`)
VALUES
    ('site_footer_html', '', 'Footer HTML', '底部版权、备案号、社交链接等 HTML', 'custom', 10, 'public'),
    ('site_left_corner_html', '', '左下角 HTML', '左下角悬浮信息 HTML', 'custom', 20, 'public'),
    ('site_right_corner_html', '', '右下角 HTML', '右下角悬浮信息 HTML', 'custom', 30, 'public'),
    ('site_stat_enabled', '0', '统计脚本开关', '是否启用结构化统计脚本', 'custom', 40, 'public'),
    ('site_stat_script_url', '', '统计脚本地址', '统计脚本 src 地址，例如 //js.llk.hk', 'custom', 50, 'public'),
    ('site_stat_site_id', '', '统计站点 ID', '统计服务的站点 ID，例如 cf7191d1', 'custom', 60, 'public')
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `description` = VALUES(`description`),
    `category` = VALUES(`category`),
    `sort` = VALUES(`sort`),
    `access_level` = VALUES(`access_level`);
