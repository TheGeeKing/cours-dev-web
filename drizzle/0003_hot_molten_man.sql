CREATE TABLE `visio_event` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`roomId` text(255) NOT NULL,
	`actorParticipantId` text(255),
	`recipientParticipantId` text(255),
	`type` text(255) NOT NULL,
	`payload` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`roomId`) REFERENCES `visio_room`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`actorParticipantId`) REFERENCES `visio_participant`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipientParticipantId`) REFERENCES `visio_participant`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `visio_event_room_id_idx` ON `visio_event` (`roomId`);--> statement-breakpoint
CREATE INDEX `visio_event_recipient_participant_id_idx` ON `visio_event` (`recipientParticipantId`);--> statement-breakpoint
CREATE TABLE `visio_participant` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`roomId` text(255) NOT NULL,
	`linkedUserId` text(255),
	`role` text(255) NOT NULL,
	`displayName` text(255) NOT NULL,
	`tokenHash` text(255) NOT NULL,
	`status` text(255) NOT NULL,
	`lastSeenAt` integer NOT NULL,
	`joinedAt` integer NOT NULL,
	`admittedAt` integer,
	`leftAt` integer,
	FOREIGN KEY (`roomId`) REFERENCES `visio_room`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`linkedUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `visio_participant_tokenHash_unique` ON `visio_participant` (`tokenHash`);--> statement-breakpoint
CREATE INDEX `visio_participant_room_id_idx` ON `visio_participant` (`roomId`);--> statement-breakpoint
CREATE INDEX `visio_participant_linked_user_id_idx` ON `visio_participant` (`linkedUserId`);--> statement-breakpoint
CREATE INDEX `visio_participant_status_idx` ON `visio_participant` (`status`);--> statement-breakpoint
CREATE TABLE `visio_room` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`roomSlug` text(255) NOT NULL,
	`hostUserId` text(255) NOT NULL,
	`hostDisplayName` text(255) NOT NULL,
	`requireJoinAuth` integer DEFAULT false NOT NULL,
	`requireWaitingRoom` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`lastActivityAt` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`endedAt` integer,
	FOREIGN KEY (`hostUserId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `visio_room_roomSlug_unique` ON `visio_room` (`roomSlug`);--> statement-breakpoint
CREATE INDEX `visio_room_host_user_id_idx` ON `visio_room` (`hostUserId`);--> statement-breakpoint
CREATE INDEX `visio_room_expires_at_idx` ON `visio_room` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `visio_room_ended_at_idx` ON `visio_room` (`endedAt`);