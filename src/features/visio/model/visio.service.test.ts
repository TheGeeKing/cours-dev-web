// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const insertReturningMock = vi.fn();
const insertValuesMock = vi.fn(() => ({ returning: insertReturningMock }));
const insertMock = vi.fn(() => ({ values: insertValuesMock }));

const selectLimitMock = vi.fn();
const selectWhereMock = vi.fn(() => ({ limit: selectLimitMock }));
const selectFromMock = vi.fn(() => ({ where: selectWhereMock }));
const selectMock = vi.fn(() => ({ from: selectFromMock }));

const deleteWhereMock = vi.fn();
const deleteMock = vi.fn(() => ({ where: deleteWhereMock }));

vi.mock("@/server/db", () => ({
	db: {
		insert: insertMock,
		select: selectMock,
		delete: deleteMock,
		update: vi.fn(),
	},
}));

describe("visio.service", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		insertMock.mockReturnValue({ values: insertValuesMock });
		insertValuesMock.mockReturnValue({ returning: insertReturningMock });
		selectMock.mockReturnValue({ from: selectFromMock });
		selectFromMock.mockReturnValue({ where: selectWhereMock });
		selectWhereMock.mockReturnValue({ limit: selectLimitMock });
		deleteMock.mockReturnValue({ where: deleteWhereMock });
	});

	it("creates a room and host session metadata", async () => {
		insertReturningMock.mockResolvedValueOnce([
			{
				id: "room-1",
				roomSlug: "room-slug",
				hostUserId: "user-1",
				hostDisplayName: "Host",
				requireJoinAuth: false,
				requireWaitingRoom: true,
				createdAt: new Date("2026-04-03T08:00:00.000Z"),
				lastActivityAt: new Date("2026-04-03T08:00:00.000Z"),
				expiresAt: new Date("2026-04-04T08:00:00.000Z"),
				endedAt: null,
			},
		]);

		const { createVisioRoom } = await import("./visio.service");
		const result = await createVisioRoom({
			hostUserId: "user-1",
			hostDisplayName: "Host",
			requireJoinAuth: false,
			requireWaitingRoom: true,
		});

		expect(insertMock).toHaveBeenCalledTimes(2);
		expect(result.response.sharePath).toBe("/visio/room-slug");
		expect(result.response.settings.requireWaitingRoom).toBe(true);
		expect(result.participantToken.length).toBeGreaterThan(10);
	});

	it("rejects guest joins when auth is required", async () => {
		selectLimitMock.mockResolvedValueOnce([
			{
				id: "room-1",
				roomSlug: "room-slug",
				hostUserId: "user-1",
				hostDisplayName: "Host",
				requireJoinAuth: true,
				requireWaitingRoom: false,
				createdAt: new Date("2026-04-03T08:00:00.000Z"),
				lastActivityAt: new Date("2026-04-03T08:00:00.000Z"),
				expiresAt: new Date("2026-04-04T08:00:00.000Z"),
				endedAt: null,
			},
		]);

		const { joinVisioRoom } = await import("./visio.service");

		await expect(
			joinVisioRoom({
				slug: "room-slug",
				displayName: "Guest",
				linkedUserId: null,
			}),
		).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});

	it("deletes ended and expired rooms during cleanup", async () => {
		selectFromMock.mockResolvedValueOnce([
			{
				id: "room-1",
				roomSlug: "ended-room",
				hostUserId: "user-1",
				hostDisplayName: "Host",
				requireJoinAuth: false,
				requireWaitingRoom: false,
				createdAt: new Date("2026-04-03T08:00:00.000Z"),
				lastActivityAt: new Date("2026-04-03T08:00:00.000Z"),
				expiresAt: new Date("2026-04-04T08:00:00.000Z"),
				endedAt: new Date("2026-04-03T08:30:00.000Z"),
			},
			{
				id: "room-2",
				roomSlug: "live-room",
				hostUserId: "user-2",
				hostDisplayName: "Host 2",
				requireJoinAuth: false,
				requireWaitingRoom: false,
				createdAt: new Date("2026-04-03T08:00:00.000Z"),
				lastActivityAt: new Date("2026-04-03T08:00:00.000Z"),
				expiresAt: new Date("2026-04-10T08:00:00.000Z"),
				endedAt: null,
			},
		] as never);

		const { deleteExpiredVisioRooms } = await import("./visio.service");
		const result = await deleteExpiredVisioRooms(
			new Date("2026-04-05T08:00:00.000Z"),
		);

		expect(deleteWhereMock).toHaveBeenCalledTimes(3);
		expect(result).toEqual({ deletedCount: 1 });
	});
});
