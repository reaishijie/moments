-- DropForeignKey
ALTER TABLE `article_videos` DROP FOREIGN KEY `article_videos_article_id_fkey`;

-- DropIndex
DROP INDEX `articles_is_top_published_at_idx` ON `articles`;

-- AlterTable
ALTER TABLE `article_images` MODIFY `article_id` BIGINT UNSIGNED NULL;

-- AlterTable
ALTER TABLE `article_videos` MODIFY `article_id` BIGINT UNSIGNED NULL;

-- AlterTable
ALTER TABLE `articles` ADD COLUMN `ad_title` VARCHAR(255) NULL,
    ADD COLUMN `ad_url` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `link` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `logo` VARCHAR(255) NOT NULL,
    `sitename` VARCHAR(255) NOT NULL,
    `brief` VARCHAR(255) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `status` TINYINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notices` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `from` BIGINT UNSIGNED NULL,
    `to` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('SYSTEM', 'COMMENT', 'LIKE', 'ALERT', 'FOLLOW', 'MESSAGE') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `read_at` DATETIME(3) NULL,

    INDEX `notices_to_read_idx`(`to`, `read`),
    INDEX `notices_to_created_at_idx`(`to`, `created_at`),
    INDEX `notices_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `tags_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `article_tags` (
    `article_id` BIGINT UNSIGNED NOT NULL,
    `tag_id` BIGINT UNSIGNED NOT NULL,

    INDEX `idx_article_id`(`article_id`),
    INDEX `idx_tag_id`(`tag_id`),
    PRIMARY KEY (`article_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `articles_is_top_status_deleted_at_idx` ON `articles`(`is_top`, `status`, `deleted_at`);

-- AddForeignKey
ALTER TABLE `article_videos` ADD CONSTRAINT `article_videos_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notices` ADD CONSTRAINT `notices_from_fkey` FOREIGN KEY (`from`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notices` ADD CONSTRAINT `notices_to_fkey` FOREIGN KEY (`to`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tags` ADD CONSTRAINT `tags_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `article_tags` ADD CONSTRAINT `article_tags_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `article_tags` ADD CONSTRAINT `article_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
