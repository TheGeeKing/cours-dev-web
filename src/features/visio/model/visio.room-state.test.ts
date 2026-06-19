// @vitest-environment node

import { describe, expect, it } from "vitest";

import { applyVisioRoomPageEvent } from "@/features/visio/model/visio.room-state";
import type {
	VisioPendingState,
	VisioRoomEvent,
	VisioRoomSummary,
} from "@/features/visio/model/visio.types";

const room: VisioRoomSummary = {
	slug: "demo-room",
	sharePath: "/visio/demo-room",
	hostDisplayName: "Host",
	settings: {
		requireJoinAuth: false,
		requireWaitingRoom: true,
	},
	settingsLocked: false,
	expiresAt: "2026-04-04T08:00:00.000Z",
};

const pendingState: VisioPendingState = {
	status: "pending",
	room,
	self: {
		participantId: "guest-1",
		displayName: "Guest",
		role: "guest",
		status: "pending",
	},
};

const event = (
	overrides: Partial<VisioRoomEvent> & Pick<VisioRoomEvent, "type">,
): VisioRoomEvent => ({ id: 1, ...overrides }) as VisioRoomEvent;

describe("applyVisioRoomPageEvent", () => {
	it("moves a pending guest into the call when admission is approved", () => {
		const nextState = applyVisioRoomPageEvent(
			pendingState,
			event({
				type: "admission-approved",
				participant: {
					...pendingState.self,
					status: "active",
				},
			}),
		);

		expect(nextState).toMatchObject({
			status: "in_call",
			self: { status: "active" },
			peer: {
				participantId: "host",
				displayName: "Host",
				role: "host",
				status: "active",
			},
			pendingGuest: null,
		});
	});

	it("rejects a pending guest when admission is denied", () => {
		const nextState = applyVisioRoomPageEvent(
			pendingState,
			event({
				type: "admission-rejected",
				participant: {
					...pendingState.self,
					status: "rejected",
				},
			}),
		);

		expect(nextState).toMatchObject({
			status: "rejected",
			self: { status: "rejected" },
		});
	});

	it("ends the room when a room-ended event is received", () => {
		const nextState = applyVisioRoomPageEvent(
			pendingState,
			event({ type: "room-ended" }),
		);

		expect(nextState).toEqual({
			status: "ended",
			room,
		});
	});
});
