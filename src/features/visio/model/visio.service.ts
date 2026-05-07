import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { and, asc, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";

import { env } from "@/env";
import { db } from "@/server/db";
import { visioEvent, visioParticipant, visioRoom } from "@/server/db/schema";
import {
	buildVisioRoomPath,
	VISIO_DEFAULT_ICE_SERVERS,
	VISIO_ROOM_RETENTION_MS,
} from "./visio.constants";
import { VisioError } from "./visio.errors";
import type {
	VisioCreateRoomResponse,
	VisioIceServer,
	VisioJoinRoomResponse,
	VisioParticipantStatus,
	VisioParticipantSummary,
	VisioRole,
	VisioRoomEvent,
	VisioRoomPageState,
	VisioRoomSettings,
	VisioRoomSettingsResponse,
	VisioSignalPayload,
} from "./visio.types";

type VisioRoomRecord = typeof visioRoom.$inferSelect;
type VisioParticipantRecord = typeof visioParticipant.$inferSelect;
type VisioEventRecord = typeof visioEvent.$inferSelect;

type StoredVisioEventPayload =
	| {
			participant: VisioParticipantSummary;
	  }
	| {
			settings: VisioRoomSettings;
			settingsLocked: boolean;
	  }
	| ({
			participant: VisioParticipantSummary;
	  } & Omit<VisioSignalPayload, "signalType"> & {
				signalType: VisioSignalPayload["signalType"];
			});

const visioIceServerSchema = z.object({
	urls: z.union([z.string(), z.array(z.string()).min(1)]),
	username: z.string().optional(),
	credential: z.string().optional(),
});

const visioIceServersSchema = z.array(visioIceServerSchema).min(1);

const buildParticipantSummary = (
	record: Pick<
		VisioParticipantRecord,
		"id" | "displayName" | "role" | "status"
	>,
): VisioParticipantSummary => ({
	participantId: record.id,
	displayName: record.displayName,
	role: record.role as VisioRole,
	status: record.status as VisioParticipantStatus,
});

const buildRoomSummary = (room: VisioRoomRecord, settingsLocked: boolean) => ({
	slug: room.roomSlug,
	sharePath: buildVisioRoomPath(room.roomSlug),
	hostDisplayName: room.hostDisplayName,
	settings: {
		requireJoinAuth: room.requireJoinAuth,
		requireWaitingRoom: room.requireWaitingRoom,
	},
	settingsLocked,
	expiresAt: room.expiresAt.toISOString(),
});

const hashParticipantToken = (token: string) =>
	createHash("sha256").update(token).digest("hex");

const createParticipantSession = () => {
	const rawToken = randomBytes(24).toString("base64url");
	return {
		rawToken,
		tokenHash: hashParticipantToken(rawToken),
	};
};

const createRoomSlug = () => randomBytes(12).toString("base64url");

const isRoomExpired = (room: Pick<VisioRoomRecord, "expiresAt">, now: Date) =>
	room.expiresAt.getTime() <= now.getTime();

const isRoomEnded = (room: Pick<VisioRoomRecord, "endedAt">) =>
	room.endedAt !== null;

const ensureRoomIsOpen = (room: VisioRoomRecord, now: Date) => {
	if (isRoomExpired(room, now)) {
		throw new VisioError("Ce salon a expiré.", 410, "EXPIRED");
	}

	if (isRoomEnded(room)) {
		throw new VisioError("Ce salon est déjà terminé.", 410, "CONFLICT");
	}
};

const parseStoredEvent = (record: VisioEventRecord): VisioRoomEvent => {
	const payload = JSON.parse(record.payload) as StoredVisioEventPayload;

	switch (record.type) {
		case "guest-requested":
			return {
				id: record.id,
				type: "guest-requested",
				participant: (payload as { participant: VisioParticipantSummary })
					.participant,
			};
		case "participant-joined":
			return {
				id: record.id,
				type: "participant-joined",
				participant: (payload as { participant: VisioParticipantSummary })
					.participant,
			};
		case "admission-approved":
			return {
				id: record.id,
				type: "admission-approved",
				participant: (payload as { participant: VisioParticipantSummary })
					.participant,
			};
		case "admission-rejected":
			return {
				id: record.id,
				type: "admission-rejected",
				participant: (payload as { participant: VisioParticipantSummary })
					.participant,
			};
		case "participant-left":
			return {
				id: record.id,
				type: "participant-left",
				participant: (payload as { participant: VisioParticipantSummary })
					.participant,
			};
		case "room-updated":
			return {
				id: record.id,
				type: "room-updated",
				settings: (
					payload as { settings: VisioRoomSettings; settingsLocked: boolean }
				).settings,
				settingsLocked: (
					payload as { settings: VisioRoomSettings; settingsLocked: boolean }
				).settingsLocked,
			};
		case "room-ended":
			return {
				id: record.id,
				type: "room-ended",
			};
		case "signal":
			return {
				id: record.id,
				type: "signal",
				participant: (
					payload as {
						participant: VisioParticipantSummary;
						signalType: VisioSignalPayload["signalType"];
						data: VisioSignalPayload["data"];
					}
				).participant,
				signalType: (
					payload as {
						participant: VisioParticipantSummary;
						signalType: VisioSignalPayload["signalType"];
						data: VisioSignalPayload["data"];
					}
				).signalType,
				data: (
					payload as {
						participant: VisioParticipantSummary;
						signalType: VisioSignalPayload["signalType"];
						data: VisioSignalPayload["data"];
					}
				).data,
			} as VisioRoomEvent;
		default:
			throw new VisioError(
				`Type d'événement visio non pris en charge : "${record.type}".`,
				500,
				"INTERNAL_ERROR",
			);
	}
};

const appendRoomEvent = async (input: {
	roomId: string;
	type: VisioRoomEvent["type"];
	payload?: StoredVisioEventPayload;
	actorParticipantId?: string | null;
	recipientParticipantId?: string | null;
	now?: Date;
}) => {
	const [record] = await db
		.insert(visioEvent)
		.values({
			roomId: input.roomId,
			actorParticipantId: input.actorParticipantId ?? null,
			recipientParticipantId: input.recipientParticipantId ?? null,
			type: input.type,
			payload: JSON.stringify(input.payload ?? {}),
			createdAt: input.now ?? new Date(),
		})
		.returning();

	if (!record) {
		throw new VisioError(
			"L'événement du salon n'a pas pu être enregistré.",
			500,
			"INTERNAL_ERROR",
		);
	}

	return record;
};

const getRoomBySlug = async (slug: string) => {
	const [room] = await db
		.select()
		.from(visioRoom)
		.where(eq(visioRoom.roomSlug, slug))
		.limit(1);

	return room ?? null;
};

const getParticipantsForRoom = async (roomId: string) =>
	db.select().from(visioParticipant).where(eq(visioParticipant.roomId, roomId));

const getParticipantById = async (roomId: string, participantId: string) => {
	const [participant] = await db
		.select()
		.from(visioParticipant)
		.where(
			and(
				eq(visioParticipant.roomId, roomId),
				eq(visioParticipant.id, participantId),
			),
		)
		.limit(1);

	return participant ?? null;
};

const getParticipantByToken = async (
	roomId: string,
	token: string | null | undefined,
) => {
	if (!token) {
		return null;
	}

	const [participant] = await db
		.select()
		.from(visioParticipant)
		.where(
			and(
				eq(visioParticipant.roomId, roomId),
				eq(visioParticipant.tokenHash, hashParticipantToken(token)),
			),
		)
		.limit(1);

	return participant ?? null;
};

const getHostParticipant = async (roomId: string) => {
	const [participant] = await db
		.select()
		.from(visioParticipant)
		.where(
			and(
				eq(visioParticipant.roomId, roomId),
				eq(visioParticipant.role, "host"),
			),
		)
		.limit(1);

	return participant ?? null;
};

const resolveActingParticipant = async (input: {
	room: VisioRoomRecord;
	viewerUserId?: string | null;
	participantToken?: string | null;
}) => {
	const byToken = await getParticipantByToken(
		input.room.id,
		input.participantToken,
	);
	if (byToken) {
		return byToken;
	}

	if (input.viewerUserId && input.viewerUserId === input.room.hostUserId) {
		return getHostParticipant(input.room.id);
	}

	return null;
};

const updateRoomActivity = async (roomId: string, now: Date) => {
	await db
		.update(visioRoom)
		.set({ lastActivityAt: now })
		.where(eq(visioRoom.id, roomId));
};

const touchParticipantPresence = async (participantId: string, now: Date) => {
	await db
		.update(visioParticipant)
		.set({ lastSeenAt: now })
		.where(eq(visioParticipant.id, participantId));
};

const getGuestParticipants = (participants: VisioParticipantRecord[]) =>
	participants.filter((participant) => participant.role === "guest");

const getCurrentGuestRequest = (participants: VisioParticipantRecord[]) =>
	getGuestParticipants(participants).find(
		(participant) =>
			participant.status === "pending" || participant.status === "active",
	) ?? null;

const hasGuestRequest = (participants: VisioParticipantRecord[]) =>
	getGuestParticipants(participants).length > 0;

const getPeerForParticipant = (
	participants: VisioParticipantRecord[],
	self: VisioParticipantRecord,
) =>
	participants.find(
		(participant) =>
			participant.id !== self.id && participant.status === "active",
	) ?? null;

const getPendingGuest = (participants: VisioParticipantRecord[]) =>
	participants.find(
		(participant) =>
			participant.role === "guest" && participant.status === "pending",
	) ?? null;

export const getVisioIceServers = (): VisioIceServer[] => {
	if (!env.VISIO_ICE_SERVERS_JSON) {
		return [...VISIO_DEFAULT_ICE_SERVERS];
	}

	try {
		const parsed = visioIceServersSchema.parse(
			JSON.parse(env.VISIO_ICE_SERVERS_JSON),
		);
		return parsed;
	} catch (error) {
		console.error(
			"Invalid VISIO_ICE_SERVERS_JSON, falling back to STUN",
			error,
		);
		return [...VISIO_DEFAULT_ICE_SERVERS];
	}
};

export const createVisioRoom = async (input: {
	hostUserId: string;
	hostDisplayName: string;
	requireJoinAuth: boolean;
	requireWaitingRoom: boolean;
	now?: Date;
}) => {
	const now = input.now ?? new Date();
	const expiresAt = new Date(now.getTime() + VISIO_ROOM_RETENTION_MS);
	const { rawToken, tokenHash } = createParticipantSession();

	const [room] = await db
		.insert(visioRoom)
		.values({
			roomSlug: createRoomSlug(),
			hostUserId: input.hostUserId,
			hostDisplayName: input.hostDisplayName,
			requireJoinAuth: input.requireJoinAuth,
			requireWaitingRoom: input.requireWaitingRoom,
			lastActivityAt: now,
			expiresAt,
		})
		.returning();

	if (!room) {
		throw new VisioError(
			"Le salon n'a pas pu être créé.",
			500,
			"INTERNAL_ERROR",
		);
	}

	await db.insert(visioParticipant).values({
		roomId: room.id,
		linkedUserId: input.hostUserId,
		role: "host",
		displayName: input.hostDisplayName,
		tokenHash,
		status: "active",
		lastSeenAt: now,
		joinedAt: now,
		admittedAt: now,
	});

	const response: VisioCreateRoomResponse = {
		slug: room.roomSlug,
		sharePath: buildVisioRoomPath(room.roomSlug),
		hostDisplayName: room.hostDisplayName,
		settings: {
			requireJoinAuth: room.requireJoinAuth,
			requireWaitingRoom: room.requireWaitingRoom,
		},
		expiresAt: room.expiresAt.toISOString(),
	};

	return {
		response,
		participantToken: rawToken,
	};
};

export const updateVisioRoomSettings = async (input: {
	slug: string;
	hostUserId: string;
	hostParticipantToken?: string | null;
	requireJoinAuth: boolean;
	requireWaitingRoom: boolean;
	now?: Date;
}) => {
	const now = input.now ?? new Date();
	const room = await getRoomBySlug(input.slug);

	if (!room) {
		throw new VisioError("Ce salon est introuvable.", 404, "NOT_FOUND");
	}

	ensureRoomIsOpen(room, now);

	if (room.hostUserId !== input.hostUserId) {
		throw new VisioError(
			"Seul l'hôte peut modifier les réglages du salon.",
			403,
			"FORBIDDEN",
		);
	}

	const hostParticipant = await resolveActingParticipant({
		room,
		viewerUserId: input.hostUserId,
		participantToken: input.hostParticipantToken,
	});

	if (!hostParticipant || hostParticipant.role !== "host") {
		throw new VisioError(
			"L'accès hôte est requis pour cette action.",
			401,
			"UNAUTHORIZED",
		);
	}

	const participants = await getParticipantsForRoom(room.id);
	if (hasGuestRequest(participants)) {
		throw new VisioError(
			"Les réglages du salon se verrouillent après la première demande d'invité.",
			409,
			"CONFLICT",
		);
	}

	await db
		.update(visioRoom)
		.set({
			requireJoinAuth: input.requireJoinAuth,
			requireWaitingRoom: input.requireWaitingRoom,
			lastActivityAt: now,
		})
		.where(eq(visioRoom.id, room.id));

	await appendRoomEvent({
		roomId: room.id,
		type: "room-updated",
		payload: {
			settings: {
				requireJoinAuth: input.requireJoinAuth,
				requireWaitingRoom: input.requireWaitingRoom,
			},
			settingsLocked: false,
		},
		actorParticipantId: hostParticipant.id,
		now,
	});

	const response: VisioRoomSettingsResponse = {
		settings: {
			requireJoinAuth: input.requireJoinAuth,
			requireWaitingRoom: input.requireWaitingRoom,
		},
		settingsLocked: false,
	};

	return response;
};

export const getVisioRoomPageState = async (input: {
	slug: string;
	viewerUserId?: string | null;
	participantToken?: string | null;
	now?: Date;
}): Promise<VisioRoomPageState> => {
	const now = input.now ?? new Date();
	const room = await getRoomBySlug(input.slug);

	if (!room) {
		return {
			status: "ended",
			room: null,
		};
	}

	const participants = await getParticipantsForRoom(room.id);
	const settingsLocked = hasGuestRequest(participants);
	const roomSummary = buildRoomSummary(room, settingsLocked);

	if (isRoomExpired(room, now)) {
		return {
			status: "expired",
			room: roomSummary,
		};
	}

	if (isRoomEnded(room)) {
		return {
			status: "ended",
			room: roomSummary,
		};
	}

	const viewerParticipant = await resolveActingParticipant({
		room,
		viewerUserId: input.viewerUserId,
		participantToken: input.participantToken,
	});

	if (viewerParticipant?.status === "rejected") {
		return {
			status: "rejected",
			room: roomSummary,
			self: buildParticipantSummary(viewerParticipant),
		};
	}

	if (viewerParticipant?.status === "pending") {
		return {
			status: "pending",
			room: roomSummary,
			self: buildParticipantSummary(viewerParticipant),
		};
	}

	if (viewerParticipant?.status === "active") {
		const peer = getPeerForParticipant(participants, viewerParticipant);
		const pendingGuest = getPendingGuest(participants);

		return {
			status: "in_call",
			room: roomSummary,
			self: buildParticipantSummary(viewerParticipant),
			peer: peer ? buildParticipantSummary(peer) : null,
			pendingGuest:
				viewerParticipant.role === "host" && pendingGuest
					? buildParticipantSummary(pendingGuest)
					: null,
		};
	}

	const occupant = getCurrentGuestRequest(participants);
	if (occupant) {
		return {
			status: "full",
			room: roomSummary,
			occupant: buildParticipantSummary(occupant),
		};
	}

	return {
		status: "joinable",
		room: roomSummary,
		viewerSignedIn: !!input.viewerUserId,
		viewerCanJoin: !room.requireJoinAuth || !!input.viewerUserId,
	};
};

export const joinVisioRoom = async (input: {
	slug: string;
	displayName: string;
	linkedUserId?: string | null;
	participantToken?: string | null;
	now?: Date;
}) => {
	const now = input.now ?? new Date();
	const room = await getRoomBySlug(input.slug);

	if (!room) {
		throw new VisioError("Ce salon est introuvable.", 404, "NOT_FOUND");
	}

	ensureRoomIsOpen(room, now);

	if (room.requireJoinAuth && !input.linkedUserId) {
		throw new VisioError(
			"Connectez-vous avant de rejoindre ce salon.",
			401,
			"UNAUTHORIZED",
		);
	}

	const existingParticipant = await getParticipantByToken(
		room.id,
		input.participantToken,
	);
	if (
		existingParticipant &&
		(existingParticipant.status === "active" ||
			existingParticipant.status === "pending")
	) {
		throw new VisioError(
			"Vous avez déjà une session active dans ce salon avec ce navigateur.",
			409,
			"CONFLICT",
		);
	}

	const participants = await getParticipantsForRoom(room.id);
	if (getCurrentGuestRequest(participants)) {
		throw new VisioError(
			"Ce salon a déjà une session invité active.",
			409,
			"CONFLICT",
		);
	}

	const { rawToken, tokenHash } = createParticipantSession();
	const status = room.requireWaitingRoom ? "pending" : "active";

	const [participant] = await db
		.insert(visioParticipant)
		.values({
			roomId: room.id,
			linkedUserId: input.linkedUserId ?? null,
			role: "guest",
			displayName: input.displayName,
			tokenHash,
			status,
			lastSeenAt: now,
			joinedAt: now,
			admittedAt: status === "active" ? now : null,
			leftAt: null,
		})
		.returning();

	if (!participant) {
		throw new VisioError(
			"Ce salon n'a pas pu ajouter l'invité.",
			500,
			"INTERNAL_ERROR",
		);
	}

	await updateRoomActivity(room.id, now);

	await appendRoomEvent({
		roomId: room.id,
		type: status === "pending" ? "guest-requested" : "participant-joined",
		payload: {
			participant: buildParticipantSummary(participant),
		},
		actorParticipantId: participant.id,
		now,
	});

	const response: VisioJoinRoomResponse = {
		status: status === "pending" ? "pending" : "in_call",
		sharePath: buildVisioRoomPath(room.roomSlug),
		participant: buildParticipantSummary(participant),
	};

	return {
		response,
		participantToken: rawToken,
	};
};

export const reviewVisioGuestAdmission = async (input: {
	slug: string;
	hostUserId: string;
	hostParticipantToken?: string | null;
	participantId: string;
	decision: "approve" | "reject";
	now?: Date;
}) => {
	const now = input.now ?? new Date();
	const room = await getRoomBySlug(input.slug);

	if (!room) {
		throw new VisioError("Ce salon est introuvable.", 404, "NOT_FOUND");
	}

	ensureRoomIsOpen(room, now);

	if (room.hostUserId !== input.hostUserId) {
		throw new VisioError(
			"Seul l'hôte peut examiner les invités.",
			403,
			"FORBIDDEN",
		);
	}

	const hostParticipant = await resolveActingParticipant({
		room,
		viewerUserId: input.hostUserId,
		participantToken: input.hostParticipantToken,
	});

	if (!hostParticipant || hostParticipant.role !== "host") {
		throw new VisioError(
			"L'accès hôte est requis pour cette action.",
			401,
			"UNAUTHORIZED",
		);
	}

	const targetParticipant = await getParticipantById(
		room.id,
		input.participantId,
	);
	if (!targetParticipant || targetParticipant.role !== "guest") {
		throw new VisioError(
			"Cette demande d'invité n'existe pas.",
			404,
			"NOT_FOUND",
		);
	}

	if (targetParticipant.status !== "pending") {
		throw new VisioError(
			"Cette demande d'invité ne peut plus être examinée.",
			409,
			"CONFLICT",
		);
	}

	const nextStatus = input.decision === "approve" ? "active" : "rejected";

	const [updatedParticipant] = await db
		.update(visioParticipant)
		.set({
			status: nextStatus,
			admittedAt: input.decision === "approve" ? now : null,
			leftAt: input.decision === "reject" ? now : null,
			lastSeenAt: now,
		})
		.where(eq(visioParticipant.id, targetParticipant.id))
		.returning();

	if (!updatedParticipant) {
		throw new VisioError(
			"La demande d'invité n'a pas pu être mise à jour.",
			500,
			"INTERNAL_ERROR",
		);
	}

	await updateRoomActivity(room.id, now);

	await appendRoomEvent({
		roomId: room.id,
		type:
			input.decision === "approve"
				? "admission-approved"
				: "admission-rejected",
		payload: {
			participant: buildParticipantSummary(updatedParticipant),
		},
		actorParticipantId: hostParticipant.id,
		now,
	});

	if (input.decision === "approve") {
		await appendRoomEvent({
			roomId: room.id,
			type: "participant-joined",
			payload: {
				participant: buildParticipantSummary(updatedParticipant),
			},
			actorParticipantId: updatedParticipant.id,
			now,
		});
	}

	return {
		decision: input.decision,
		participant: buildParticipantSummary(updatedParticipant),
	};
};

export const sendVisioSignal = async (input: {
	slug: string;
	viewerUserId?: string | null;
	participantToken?: string | null;
	payload: VisioSignalPayload;
	now?: Date;
}) => {
	const now = input.now ?? new Date();
	const room = await getRoomBySlug(input.slug);

	if (!room) {
		throw new VisioError("Ce salon est introuvable.", 404, "NOT_FOUND");
	}

	ensureRoomIsOpen(room, now);

	const actor = await resolveActingParticipant({
		room,
		viewerUserId: input.viewerUserId,
		participantToken: input.participantToken,
	});

	if (!actor) {
		throw new VisioError(
			"Vous n'êtes pas autorisé à signaler ce salon.",
			401,
			"UNAUTHORIZED",
		);
	}

	if (actor.status !== "active") {
		throw new VisioError(
			"Seuls les participants actifs peuvent échanger des signaux d'appel.",
			409,
			"CONFLICT",
		);
	}

	const participants = await getParticipantsForRoom(room.id);
	const recipient =
		participants.find(
			(participant) =>
				participant.id !== actor.id && participant.status === "active",
		) ?? null;

	if (!recipient) {
		throw new VisioError(
			"Aucun autre participant actif n'est encore disponible.",
			409,
			"CONFLICT",
		);
	}

	await Promise.all([
		updateRoomActivity(room.id, now),
		touchParticipantPresence(actor.id, now),
		appendRoomEvent({
			roomId: room.id,
			type: "signal",
			payload: {
				participant: buildParticipantSummary(actor),
				signalType: input.payload.signalType,
				data: input.payload.data,
			},
			actorParticipantId: actor.id,
			recipientParticipantId: recipient.id,
			now,
		}),
	]);
};

export const leaveVisioRoom = async (input: {
	slug: string;
	viewerUserId?: string | null;
	participantToken?: string | null;
	now?: Date;
}) => {
	const now = input.now ?? new Date();
	const room = await getRoomBySlug(input.slug);

	if (!room) {
		throw new VisioError("Ce salon est introuvable.", 404, "NOT_FOUND");
	}

	ensureRoomIsOpen(room, now);

	const actor = await resolveActingParticipant({
		room,
		viewerUserId: input.viewerUserId,
		participantToken: input.participantToken,
	});

	if (!actor) {
		throw new VisioError(
			"Vous ne faites pas partie de ce salon.",
			401,
			"UNAUTHORIZED",
		);
	}

	if (actor.role === "host") {
		await db
			.update(visioRoom)
			.set({
				endedAt: now,
				lastActivityAt: now,
			})
			.where(eq(visioRoom.id, room.id));

		const participants = await getParticipantsForRoom(room.id);
		await Promise.all(
			participants
				.filter((participant) => participant.status !== "left")
				.map((participant) =>
					db
						.update(visioParticipant)
						.set({
							status: "left",
							leftAt: now,
							lastSeenAt: now,
						})
						.where(eq(visioParticipant.id, participant.id)),
				),
		);

		await appendRoomEvent({
			roomId: room.id,
			type: "room-ended",
			actorParticipantId: actor.id,
			now,
		});

		return { mode: "room-ended" as const };
	}

	if (actor.status === "left") {
		return { mode: "participant-left" as const };
	}

	const [updatedParticipant] = await db
		.update(visioParticipant)
		.set({
			status: "left",
			leftAt: now,
			lastSeenAt: now,
		})
		.where(eq(visioParticipant.id, actor.id))
		.returning();

	if (!updatedParticipant) {
		throw new VisioError(
			"Le participant n'a pas pu quitter le salon.",
			500,
			"INTERNAL_ERROR",
		);
	}

	await updateRoomActivity(room.id, now);
	await appendRoomEvent({
		roomId: room.id,
		type: "participant-left",
		payload: {
			participant: buildParticipantSummary(updatedParticipant),
		},
		actorParticipantId: actor.id,
		now,
	});

	return { mode: "participant-left" as const };
};

export const getVisioStreamContext = async (input: {
	slug: string;
	viewerUserId?: string | null;
	participantToken?: string | null;
	now?: Date;
}) => {
	const now = input.now ?? new Date();
	const room = await getRoomBySlug(input.slug);

	if (!room) {
		throw new VisioError("Ce salon est introuvable.", 404, "NOT_FOUND");
	}

	ensureRoomIsOpen(room, now);

	const participant = await resolveActingParticipant({
		room,
		viewerUserId: input.viewerUserId,
		participantToken: input.participantToken,
	});

	if (!participant) {
		throw new VisioError(
			"Vous n'êtes pas autorisé à écouter le flux de ce salon.",
			401,
			"UNAUTHORIZED",
		);
	}

	await touchParticipantPresence(participant.id, now);
	return {
		room,
		participant,
	};
};

export const getVisioEventsSince = async (input: {
	roomId: string;
	participantId: string;
	afterEventId: number;
}) => {
	const events = await db
		.select()
		.from(visioEvent)
		.where(
			and(
				eq(visioEvent.roomId, input.roomId),
				gt(visioEvent.id, input.afterEventId),
				or(
					isNull(visioEvent.recipientParticipantId),
					eq(visioEvent.recipientParticipantId, input.participantId),
				),
			),
		)
		.orderBy(asc(visioEvent.id));

	return events.map(parseStoredEvent);
};

export const deleteExpiredVisioRooms = async (now = new Date()) => {
	const rooms = await db.select().from(visioRoom);
	const staleRooms = rooms.filter(
		(room) => isRoomExpired(room, now) || isRoomEnded(room),
	);

	if (staleRooms.length === 0) {
		return { deletedCount: 0 };
	}

	const roomIds = staleRooms.map((room) => room.id);

	await db.delete(visioEvent).where(inArray(visioEvent.roomId, roomIds));
	await db
		.delete(visioParticipant)
		.where(inArray(visioParticipant.roomId, roomIds));
	await db.delete(visioRoom).where(inArray(visioRoom.id, roomIds));

	return { deletedCount: staleRooms.length };
};
