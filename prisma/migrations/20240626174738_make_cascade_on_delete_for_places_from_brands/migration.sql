-- DropForeignKey
ALTER TABLE `PlacesList` DROP FOREIGN KEY `placeslist_ibfk_1`;

-- AddForeignKey
ALTER TABLE `PlacesList` ADD CONSTRAINT `placeslist_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `Brands`(`brand_id`) ON DELETE CASCADE ON UPDATE NO ACTION;
