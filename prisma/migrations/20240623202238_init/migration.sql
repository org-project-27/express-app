/*
  Warnings:

  - You are about to drop the column `website` on the `PlacesList` table. All the data in the column will be lost.
  - Added the required column `email` to the `PlacesList` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `PlacesList` DROP COLUMN `website`,
    ADD COLUMN `email` VARCHAR(255) NOT NULL;
