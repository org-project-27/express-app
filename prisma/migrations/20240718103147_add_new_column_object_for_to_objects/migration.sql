/*
  Warnings:

  - Added the required column `object_for` to the `Objects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Objects` ADD COLUMN `object_for` VARCHAR(100) NOT NULL;
