-- CreateTable
CREATE TABLE `TokenSessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_for` VARCHAR(55) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `payload` JSON NOT NULL,
    `expired_at` DATE NOT NULL,
    `owner_id` INTEGER NOT NULL,

    INDEX `owner_id`(`owner_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserDetails` (
    `phone` VARCHAR(255) NULL,
    `birthday` DATE NULL,
    `bio` VARCHAR(510) NULL,
    `email_registered` BOOLEAN NOT NULL,
    `preferred_lang` VARCHAR(50) NULL,
    `user_id` INTEGER NOT NULL,

    UNIQUE INDEX `phone`(`phone`),
    UNIQUE INDEX `user_id`(`user_id`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullname` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TokenSessions` ADD CONSTRAINT `tokensessions_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `UserDetails`(`user_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `UserDetails` ADD CONSTRAINT `userdetails_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
