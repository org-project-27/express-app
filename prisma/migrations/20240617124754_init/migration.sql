/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Brands` will be added. If there are existing duplicate values, this will fail.
  - Made the column `logo` on table `Brands` required. This step will fail if there are existing NULL values in that column.
  - Made the column `owner_id` on table `Brands` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `PlacesList` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `PlacesList` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `PlacesList` required. This step will fail if there are existing NULL values in that column.
  - Made the column `zip_code` on table `PlacesList` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `PlacesList` required. This step will fail if there are existing NULL values in that column.
  - Made the column `website` on table `PlacesList` required. This step will fail if there are existing NULL values in that column.
  - Made the column `opening_hours` on table `PlacesList` required. This step will fail if there are existing NULL values in that column.
  - Made the column `brand_id` on table `PlacesList` required. This step will fail if there are existing NULL values in that column.
  - Made the column `place_id` on table `ServicesList` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Brands` DROP FOREIGN KEY `brands_ibfk_1`;

-- DropForeignKey
ALTER TABLE `PlacesList` DROP FOREIGN KEY `placeslist_ibfk_1`;

-- DropForeignKey
ALTER TABLE `ServicesList` DROP FOREIGN KEY `serviceslist_ibfk_1`;

-- AlterTable
ALTER TABLE `Brands` MODIFY `logo` VARCHAR(255) NOT NULL,
    MODIFY `owner_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `PlacesList` MODIFY `address` VARCHAR(255) NOT NULL,
    MODIFY `city` VARCHAR(100) NOT NULL,
    MODIFY `state` VARCHAR(100) NOT NULL,
    MODIFY `zip_code` VARCHAR(20) NOT NULL,
    MODIFY `phone` VARCHAR(20) NOT NULL,
    MODIFY `website` VARCHAR(255) NOT NULL,
    MODIFY `opening_hours` VARCHAR(255) NOT NULL,
    MODIFY `brand_id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `ServicesList` MODIFY `place_id` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `name` ON `Brands`(`name`);

-- AddForeignKey
ALTER TABLE `PlacesList` ADD CONSTRAINT `placeslist_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `Brands`(`brand_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ServicesList` ADD CONSTRAINT `serviceslist_ibfk_1` FOREIGN KEY (`place_id`) REFERENCES `PlacesList`(`place_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Brands` ADD CONSTRAINT `brands_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `Users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
