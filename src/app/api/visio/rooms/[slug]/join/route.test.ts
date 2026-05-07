// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const getJoinVisioRoomInputMock = vi.fn();
const joinVisioRoomMock = vi.fn();
const cookieGetMock = vi.fn();
const cookieSetMock = vi.fn();

vi.mock("@/server/better-auth", () => ({
	auth: {
		api: {
			getSession: getSessionMock,
		},
	},
}));

vi.mock("@/features/visio/model/visio.validation", () => ({
	getJoinVisioRoomInput: getJoinVisioRoomInputMock,
}));

vi.mock("@/features/visio/model/visio.service", () => ({
	joinVisioRoom: joinVisioRoomMock,
}));

vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => ({
		get: cookieGetMock,
		set: cookieSetMock,
	})),
}));

describe("POST /api/visio/rooms/[slug]/join", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("creates the guest session and stores the room cookie", async () => {
		getSessionMock.mockResolvedValue(null);
		getJoinVisioRoomInputMock.mockResolvedValue({
			displayName: "Guest",
		});
		cookieGetMock.mockReturnValue(undefined);
		joinVisioRoomMock.mockResolvedValue({
			response: {
				status: "pending",
				sharePath: "/visio/room-slug",
				participant: {
					participantId: "guest-1",
					displayName: "Guest",
					role: "guest",
					status: "pending",
				},
			},
			participantToken: "guest-token",
		});

		const { POST } = await import("./route");
		const request = new Request(
			"http://localhost/api/visio/rooms/room-slug/join",
			{
				method: "POST",
				body: JSON.stringify({}),
			},
		);

		const response = await POST(request, {
			params: Promise.resolve({ slug: "room-slug" }),
		});

		expect(response.status).toBe(201);
		expect(cookieSetMock).toHaveBeenCalledTimes(1);
		await expect(response.json()).resolves.toMatchObject({
			status: "pending",
		});
	});
});
