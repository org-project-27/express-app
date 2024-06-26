/*
  Warnings:

  - You are about to drop the column `email` on the `Brands` table. All the data in the column will be lost.
  - Added the required column `website` to the `Brands` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `email` ON `Brands`;

-- AlterTable
ALTER TABLE `Brands` DROP COLUMN `email`,
    ADD COLUMN `website` VARCHAR(255) NOT NULL;
