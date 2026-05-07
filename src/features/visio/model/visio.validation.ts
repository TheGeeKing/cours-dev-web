import { z } from "zod";

import {
	VISIO_DISPLAY_NAME_MAX_LENGTH,
	VISIO_DISPLAY_NAME_MIN_LENGTH,
} from "./visio.constants";
import { VisioError } from "./visio.errors";

const displayNameSchema = z
	.string()
	.trim()
	.min(
		VISIO_DISPLAY_NAME_MIN_LENGTH,
		`Les noms d'affichage doivent contenir au moins ${VISIO_DISPLAY_NAME_MIN_LENGTH} caractères.`,
	)
	.max(
		VISIO_DISPLAY_NAME_MAX_LENGTH,
		`Les noms d'affichage doivent rester sous ${VISIO_DISPLAY_NAME_MAX_LENGTH} caractères.`,
	);

const roomSettingsSchema = z.object({
	requireJoinAuth: z.boolean(),
	requireWaitingRoom: z.boolean(),
});

const createRoomSchema = roomSettingsSchema.extend({
	hostDisplayName: displayNameSchema,
});

const joinRoomSchema = z.object({
	displayName: displayNameSchema,
});

const admissionDecisionSchema = z.object({
	decision: z.enum(["approve", "reject"]),
});

const iceCandidateDataSchema = z.object({
	candidate: z.string(),
	sdpMid: z.string().nullable().optional(),
	sdpMLineIndex: z.number().nullable().optional(),
	usernameFragment: z.string().nullable().optional(),
});

const signalSchema = z.discriminatedUnion("signalType", [
	z.object({
		signalType: z.literal("offer"),
		data: z.object({
			type: z.literal("offer"),
			sdp: z.string(),
		}),
	}),
	z.object({
		signalType: z.literal("answer"),
		data: z.object({
			type: z.literal("answer"),
			sdp: z.string(),
		}),
	}),
	z.object({
		signalType: z.literal("ice-candidate"),
		data: iceCandidateDataSchema,
	}),
	z.object({
		signalType: z.literal("ready"),
		data: z.null(),
	}),
	z.object({
		signalType: z.literal("hangup"),
		data: z.null(),
	}),
]);

const parseJsonBody = async (request: Request) =>
	((await request.json().catch(() => null)) ?? null) as unknown;

const parseOrThrow = <T>(schema: z.ZodSchema<T>, input: unknown) => {
	const parsed = schema.safeParse(input);

	if (!parsed.success) {
		throw new VisioError(
			parsed.error.issues[0]?.message ??
				"La validation de la requête a échoué.",
			400,
			"BAD_REQUEST",
		);
	}

	return parsed.data;
};

export const getCreateVisioRoomInput = async (request: Request) =>
	parseOrThrow(createRoomSchema, await parseJsonBody(request));

export const getJoinVisioRoomInput = async (request: Request) =>
	parseOrThrow(joinRoomSchema, await parseJsonBody(request));

export const getVisioRoomSettingsInput = async (request: Request) =>
	parseOrThrow(roomSettingsSchema, await parseJsonBody(request));

export const getVisioAdmissionInput = async (request: Request) =>
	parseOrThrow(admissionDecisionSchema, await parseJsonBody(request));

export const getVisioSignalInput = async (request: Request) =>
	parseOrThrow(signalSchema, await parseJsonBody(request));
