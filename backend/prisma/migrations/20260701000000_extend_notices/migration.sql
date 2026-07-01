ALTER TABLE `notices`
  ADD COLUMN `target_type` VARCHAR(50) NULL,
  ADD COLUMN `target_id` BIGINT UNSIGNED NULL,
  ADD COLUMN `link` VARCHAR(255) NULL,
  ADD COLUMN `deleted_at` DATETIME(3) NULL;

CREATE INDEX `notices_target_type_target_id_idx` ON `notices`(`target_type`, `target_id`);
