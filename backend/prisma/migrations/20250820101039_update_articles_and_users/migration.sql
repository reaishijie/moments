-- AlterTable
ALTER TABLE `articles` ADD COLUMN `is_ad` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_top` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `type` TINYINT UNSIGNED NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `banned_until` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `article_images` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `article_id` BIGINT UNSIGNED NOT NULL,
    `image_url` VARCHAR(255) NOT NULL,
    `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `article_images_article_id_idx`(`article_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `article_videos` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `article_id` BIGINT UNSIGNED NOT NULL,
    `video_url` VARCHAR(255) NOT NULL,
    `thumbnail_url` VARCHAR(255) NULL,
    `duration` INTEGER NULL,
    `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `article_videos_article_id_idx`(`article_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `articles_is_top_published_at_idx` ON `articles`(`is_top`, `published_at`);

-- CreateIndex
CREATE INDEX `articles_is_ad_idx` ON `articles`(`is_ad`);

-- AddForeignKey
ALTER TABLE `article_images` ADD CONSTRAINT `article_images_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `article_videos` ADD CONSTRAINT `article_videos_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
