CREATE TABLE `transfer_file` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`ownerUserId` text(255) NOT NULL,
	`shareSlug` text(255) NOT NULL,
	`originalFilename` text NOT NULL,
	`storedFilename` text(255) NOT NULL,
	`mimeType` text(255) NOT NULL,
	`sizeBytes` integer NOT NULL,
	`storagePath` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`expiresAt` integer NOT NULL,
	FOREIGN KEY (`ownerUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transfer_file_shareSlug_unique` ON `transfer_file` (`shareSlug`);--> statement-breakpoint
CREATE INDEX `transfer_file_owner_user_id_idx` ON `transfer_file` (`ownerUserId`);--> statement-breakpoint
CREATE INDEX `transfer_file_expires_at_idx` ON `transfer_file` (`expiresAt`);