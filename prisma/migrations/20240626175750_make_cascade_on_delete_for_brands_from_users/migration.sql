-- DropForeignKey
ALTER TABLE `Brands` DROP FOREIGN KEY `brands_ibfk_1`;

-- AddForeignKey
ALTER TABLE `Brands` ADD CONSTRAINT `brands_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
