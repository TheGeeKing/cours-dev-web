// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const getCreateVisioRoomInputMock = vi.fn();
const createVisioRoomMock = vi.fn();
const cookieSetMock = vi.fn();

vi.mock("@/server/better-auth", () => ({
	auth: {
		api: {
			getSession: getSessionMock,
		},
	},
}));

vi.mock("@/features/visio/model/visio.validation", () => ({
	getCreateVisioRoomInput: getCreateVisioRoomInputMock,
}));

vi.mock("@/features/visio/model/visio.service", () => ({
	createVisioRoom: createVisioRoomMock,
}));

vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => ({
		set: cookieSetMock,
	})),
}));

describe("POST /api/visio/rooms", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("rejects unauthenticated room creation", async () => {
		getSessionMock.mockResolvedValue(null);
		const { POST } = await import("./route");
		const request = new Request("http://localhost/api/visio/rooms", {
			method: "POST",
			body: JSON.stringify({}),
		});

		const response = await POST(request);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({
			error: "Connectez-vous avant de créer un salon visio.",
		});
	});

	it("creates the room and stores the host cookie", async () => {
		getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
		getCreateVisioRoomInputMock.mockResolvedValue({
			hostDisplayName: "Host",
			requireJoinAuth: true,
			requireWaitingRoom: false,
		});
		createVisioRoomMock.mockResolvedValue({
			response: {
				slug: "room-slug",
				sharePath: "/visio/room-slug",
				hostDisplayName: "Host",
				settings: {
					requireJoinAuth: true,
					requireWaitingRoom: false,
				},
				expiresAt: "2026-04-04T08:00:00.000Z",
			},
			participantToken: "token-123",
		});

		const { POST } = await import("./route");
		const request = new Request("http://localhost/api/visio/rooms", {
			method: "POST",
			body: JSON.stringify({}),
		});

		const response = await POST(request);

		expect(response.status).toBe(201);
		expect(cookieSetMock).toHaveBeenCalledTimes(1);
		await expect(response.json()).resolves.toMatchObject({
			slug: "room-slug",
			sharePath: "/visio/room-slug",
		});
	});
});
