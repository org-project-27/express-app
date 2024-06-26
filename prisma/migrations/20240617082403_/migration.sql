-- CreateTable
CREATE TABLE `TokenSessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `created_for` VARCHAR(55) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `payload` JSON NOT NULL,
    `expired_in` VARCHAR(55) NOT NULL,
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
    `register_date` VARCHAR(55) NOT NULL,

    UNIQUE INDEX `email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlacesList` (
    `place_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `type` ENUM('Restaurant', 'Cafe', 'Hospital', 'CarFixing', 'Other') NOT NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `zip_code` VARCHAR(20) NULL,
    `phone` VARCHAR(20) NULL,
    `website` VARCHAR(255) NULL,
    `opening_hours` VARCHAR(255) NULL,
    `brand_id` INTEGER NULL,

    INDEX `brand_id`(`brand_id`),
    PRIMARY KEY (`place_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServicesList` (
    `service_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(10, 2) NULL,
    `category_id` INTEGER NULL,
    `place_id` INTEGER NULL,

    INDEX `place_id`(`place_id`),
    PRIMARY KEY (`service_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Brands` (
    `brand_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `logo` VARCHAR(255) NULL,
    `email` VARCHAR(255) NOT NULL,
    `bio` TEXT NULL,
    `owner_id` INTEGER NULL,

    UNIQUE INDEX `email`(`email`),
    INDEX `owner_id`(`owner_id`),
    PRIMARY KEY (`brand_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TokenSessions` ADD CONSTRAINT `tokensessions_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `UserDetails`(`user_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `UserDetails` ADD CONSTRAINT `userdetails_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `PlacesList` ADD CONSTRAINT `placeslist_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `Brands`(`brand_id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ServicesList` ADD CONSTRAINT `serviceslist_ibfk_1` FOREIGN KEY (`place_id`) REFERENCES `PlacesList`(`place_id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Brands` ADD CONSTRAINT `brands_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `Users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
