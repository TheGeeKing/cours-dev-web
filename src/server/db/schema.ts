import { relations, sql } from "drizzle-orm";
import { index, sqliteTable } from "drizzle-orm/sqlite-core";

// Better Auth core tables
export const user = sqliteTable("user", (d) => ({
	id: d
		.text({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: d.text({ length: 255 }),
	email: d.text({ length: 255 }).notNull().unique(),
	emailVerified: d.integer({ mode: "boolean" }).default(false),
	image: d.text({ length: 255 }),
	createdAt: d
		.integer({ mode: "timestamp" })
		.default(sql`(unixepoch())`)
		.notNull(),
	updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
}));

export const account = sqliteTable(
	"account",
	(d) => ({
		id: d
			.text({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: d
			.text({ length: 255 })
			.notNull()
			.references(() => user.id),
		accountId: d.text({ length: 255 }).notNull(),
		providerId: d.text({ length: 255 }).notNull(),
		accessToken: d.text(),
		refreshToken: d.text(),
		accessTokenExpiresAt: d.integer({ mode: "timestamp" }),
		refreshTokenExpiresAt: d.integer({ mode: "timestamp" }),
		scope: d.text({ length: 255 }),
		idToken: d.text(),
		password: d.text(),
		createdAt: d
			.integer({ mode: "timestamp" })
			.default(sql`(unixepoch())`)
			.notNull(),
		updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
	}),
	(t) => [index("account_user_id_idx").on(t.userId)],
);

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const session = sqliteTable(
	"session",
	(d) => ({
		id: d
			.text({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: d
			.text({ length: 255 })
			.notNull()
			.references(() => user.id),
		token: d.text({ length: 255 }).notNull().unique(),
		expiresAt: d.integer({ mode: "timestamp" }).notNull(),
		ipAddress: d.text({ length: 255 }),
		userAgent: d.text({ length: 255 }),
		createdAt: d
			.integer({ mode: "timestamp" })
			.default(sql`(unixepoch())`)
			.notNull(),
		updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
	}),
	(t) => [index("session_user_id_idx").on(t.userId)],
);

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const verification = sqliteTable(
	"verification",
	(d) => ({
		id: d
			.text({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		identifier: d.text({ length: 255 }).notNull(),
		value: d.text({ length: 255 }).notNull(),
		expiresAt: d.integer({ mode: "timestamp" }).notNull(),
		createdAt: d
			.integer({ mode: "timestamp" })
			.default(sql`(unixepoch())`)
			.notNull(),
		updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
	}),
	(t) => [index("verification_identifier_idx").on(t.identifier)],
);

export const transferFile = sqliteTable(
	"transfer_file",
	(d) => ({
		id: d
			.text({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		ownerUserId: d
			.text({ length: 255 })
			.notNull()
			.references(() => user.id),
		shareSlug: d.text({ length: 255 }).notNull().unique(),
		originalFilename: d.text().notNull(),
		storedFilename: d.text({ length: 255 }).notNull(),
		mimeType: d.text({ length: 255 }).notNull(),
		sizeBytes: d.integer().notNull(),
		storagePath: d.text().notNull(),
		createdAt: d
			.integer({ mode: "timestamp" })
			.default(sql`(unixepoch())`)
			.notNull(),
		expiresAt: d.integer({ mode: "timestamp" }).notNull(),
	}),
	(t) => [
		index("transfer_file_owner_user_id_idx").on(t.ownerUserId),
		index("transfer_file_expires_at_idx").on(t.expiresAt),
	],
);

export const visioRoom = sqliteTable(
	"visio_room",
	(d) => ({
		id: d
			.text({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		roomSlug: d.text({ length: 255 }).notNull().unique(),
		hostUserId: d
			.text({ length: 255 })
			.notNull()
			.references(() => user.id),
		hostDisplayName: d.text({ length: 255 }).notNull(),
		requireJoinAuth: d.integer({ mode: "boolean" }).default(false).notNull(),
		requireWaitingRoom: d
			.integer({ mode: "boolean" })
			.default(false)
			.notNull(),
		createdAt: d
			.integer({ mode: "timestamp" })
			.default(sql`(unixepoch())`)
			.notNull(),
		lastActivityAt: d.integer({ mode: "timestamp" }).notNull(),
		expiresAt: d.integer({ mode: "timestamp" }).notNull(),
		endedAt: d.integer({ mode: "timestamp" }),
	}),
	(t) => [
		index("visio_room_host_user_id_idx").on(t.hostUserId),
		index("visio_room_expires_at_idx").on(t.expiresAt),
		index("visio_room_ended_at_idx").on(t.endedAt),
	],
);

export const visioParticipant = sqliteTable(
	"visio_participant",
	(d) => ({
		id: d
			.text({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		roomId: d
			.text({ length: 255 })
			.notNull()
			.references(() => visioRoom.id),
		linkedUserId: d.text({ length: 255 }).references(() => user.id),
		role: d.text({ length: 255 }).notNull(),
		displayName: d.text({ length: 255 }).notNull(),
		tokenHash: d.text({ length: 255 }).notNull().unique(),
		status: d.text({ length: 255 }).notNull(),
		lastSeenAt: d.integer({ mode: "timestamp" }).notNull(),
		joinedAt: d.integer({ mode: "timestamp" }).notNull(),
		admittedAt: d.integer({ mode: "timestamp" }),
		leftAt: d.integer({ mode: "timestamp" }),
	}),
	(t) => [
		index("visio_participant_room_id_idx").on(t.roomId),
		index("visio_participant_linked_user_id_idx").on(t.linkedUserId),
		index("visio_participant_status_idx").on(t.status),
	],
);

export const visioEvent = sqliteTable(
	"visio_event",
	(d) => ({
		id: d.integer().primaryKey({ autoIncrement: true }),
		roomId: d
			.text({ length: 255 })
			.notNull()
			.references(() => visioRoom.id),
		actorParticipantId: d
			.text({ length: 255 })
			.references(() => visioParticipant.id),
		recipientParticipantId: d
			.text({ length: 255 })
			.references(() => visioParticipant.id),
		type: d.text({ length: 255 }).notNull(),
		payload: d.text().notNull(),
		createdAt: d
			.integer({ mode: "timestamp" })
			.default(sql`(unixepoch())`)
			.notNull(),
	}),
	(t) => [
		index("visio_event_room_id_idx").on(t.roomId),
		index("visio_event_recipient_participant_id_idx").on(t.recipientParticipantId),
	],
);

export const transferFileRelations = relations(transferFile, ({ one }) => ({
	owner: one(user, {
		fields: [transferFile.ownerUserId],
		references: [user.id],
	}),
}));

export const visioRoomRelations = relations(visioRoom, ({ many, one }) => ({
	host: one(user, {
		fields: [visioRoom.hostUserId],
		references: [user.id],
	}),
	participants: many(visioParticipant),
	events: many(visioEvent),
}));

export const visioParticipantRelations = relations(
	visioParticipant,
	({ many, one }) => ({
		room: one(visioRoom, {
			fields: [visioParticipant.roomId],
			references: [visioRoom.id],
		}),
		linkedUser: one(user, {
			fields: [visioParticipant.linkedUserId],
			references: [user.id],
		}),
		actorEvents: many(visioEvent, { relationName: "visio_event_actor" }),
		recipientEvents: many(visioEvent, {
			relationName: "visio_event_recipient",
		}),
	}),
);

export const visioEventRelations = relations(visioEvent, ({ one }) => ({
	room: one(visioRoom, {
		fields: [visioEvent.roomId],
		references: [visioRoom.id],
	}),
	actorParticipant: one(visioParticipant, {
		fields: [visioEvent.actorParticipantId],
		references: [visioParticipant.id],
		relationName: "visio_event_actor",
	}),
	recipientParticipant: one(visioParticipant, {
		fields: [visioEvent.recipientParticipantId],
		references: [visioParticipant.id],
		relationName: "visio_event_recipient",
	}),
}));

export const userRelations = relations(user, ({ many }) => ({
	account: many(account),
	session: many(session),
	transferFiles: many(transferFile),
	hostedVisioRooms: many(visioRoom),
	visioParticipants: many(visioParticipant),
}));
