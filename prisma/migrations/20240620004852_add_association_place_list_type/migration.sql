-- AddForeignKey
ALTER TABLE `PlacesList` ADD CONSTRAINT `PlacesList_type_fkey` FOREIGN KEY (`type`) REFERENCES `PlaceListType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
