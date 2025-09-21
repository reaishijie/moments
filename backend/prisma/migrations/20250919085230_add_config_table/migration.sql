-- CreateTable
CREATE TABLE `config` (
    `k` VARCHAR(191) NOT NULL,
    `v` TEXT NOT NULL,

    UNIQUE INDEX `config_k_key`(`k`),
    PRIMARY KEY (`k`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
