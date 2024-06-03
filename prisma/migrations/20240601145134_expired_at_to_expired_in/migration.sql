/*
  Warnings:

  - You are about to drop the column `expired_at` on the `TokenSessions` table. All the data in the column will be lost.
  - Added the required column `expired_in` to the `TokenSessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `TokenSessions` DROP COLUMN `expired_at`,
    ADD COLUMN `expired_in` VARCHAR(55) NOT NULL;
