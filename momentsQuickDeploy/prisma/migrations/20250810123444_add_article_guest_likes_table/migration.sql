-- CreateTable
CREATE TABLE `article_guest_likes` (
    `guest_id` VARCHAR(255) NOT NULL,
    `article_id` BIGINT UNSIGNED NOT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `article_guest_likes_article_id_idx`(`article_id`),
    PRIMARY KEY (`guest_id`, `article_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `article_guest_likes` ADD CONSTRAINT `article_guest_likes_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
