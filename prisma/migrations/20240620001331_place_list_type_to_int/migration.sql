/*
  Warnings:

  - You are about to alter the column `type` on the `PlacesList` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Int`.

*/
-- AlterTable
ALTER TABLE `PlacesList` MODIFY `type` INTEGER NOT NULL;
