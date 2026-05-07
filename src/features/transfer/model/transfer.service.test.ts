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

const accessMock = vi.fn();
const mkdirMock = vi.fn();
const unlinkMock = vi.fn();
const writeFileMock = vi.fn();

vi.mock("@/server/db", () => ({
	db: {
		insert: insertMock,
		select: selectMock,
		delete: deleteMock,
	},
}));

vi.mock("node:fs/promises", () => ({
	access: accessMock,
	mkdir: mkdirMock,
	unlink: unlinkMock,
	writeFile: writeFileMock,
}));

describe("transfer.service", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		selectFromMock.mockReturnValue({ where: selectWhereMock });
		selectWhereMock.mockReturnValue({ limit: selectLimitMock });
		insertMock.mockReturnValue({ values: insertValuesMock });
		insertValuesMock.mockReturnValue({ returning: insertReturningMock });
		deleteMock.mockReturnValue({ where: deleteWhereMock });
	});

	it("persists metadata and writes the uploaded file", async () => {
		const createdAt = new Date("2026-04-03T08:00:00.000Z");
		const expiresAt = new Date("2026-04-10T08:00:00.000Z");
		insertReturningMock.mockResolvedValue([
			{
				id: "transfer-1",
				ownerUserId: "user-1",
				shareSlug: "secret-slug",
				originalFilename: "report.pdf",
				storedFilename: "secret-slug.pdf",
				mimeType: "application/pdf",
				sizeBytes: 3,
				storagePath: "secret-slug.pdf",
				createdAt,
				expiresAt,
			},
		]);

		const { saveUploadedTransferFile } = await import(
			"./transfer.service"
		);

		const result = await saveUploadedTransferFile({
			file: new File(["abc"], "report.pdf", { type: "application/pdf" }),
			ownerUserId: "user-1",
		});

		expect(mkdirMock).toHaveBeenCalled();
		expect(writeFileMock).toHaveBeenCalledTimes(1);
		expect(insertMock).toHaveBeenCalledTimes(1);
		expect(result.sharePath).toBe("/transfer/secret-slug");
		expect(result.originalFilename).toBe("report.pdf");
	});

	it("returns a missing state when the backing file is gone", async () => {
		selectLimitMock.mockResolvedValue([
			{
				id: "transfer-1",
				ownerUserId: "user-1",
				shareSlug: "secret-slug",
				originalFilename: "report.pdf",
				storedFilename: "secret-slug.pdf",
				mimeType: "application/pdf",
				sizeBytes: 3,
				storagePath: "secret-slug.pdf",
				createdAt: new Date("2026-04-03T08:00:00.000Z"),
				expiresAt: new Date("2026-04-10T08:00:00.000Z"),
			},
		]);
		accessMock.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));

		const { getTransferShareState } = await import("./transfer.service");
		const state = await getTransferShareState("secret-slug");

		expect(state).toEqual({ status: "missing" });
	});

	it("deletes expired metadata even if the file is already missing", async () => {
		selectWhereMock.mockResolvedValue([
			{
				id: "transfer-1",
				ownerUserId: "user-1",
				shareSlug: "expired-slug",
				originalFilename: "old.txt",
				storedFilename: "expired-slug.txt",
				mimeType: "text/plain",
				sizeBytes: 3,
				storagePath: "expired-slug.txt",
				createdAt: new Date("2026-03-20T08:00:00.000Z"),
				expiresAt: new Date("2026-03-27T08:00:00.000Z"),
			},
		] as never);
		unlinkMock.mockRejectedValue(Object.assign(new Error("missing"), { code: "ENOENT" }));

		const { deleteExpiredTransferFiles } = await import("./transfer.service");
		const result = await deleteExpiredTransferFiles(
			new Date("2026-04-03T08:00:00.000Z"),
		);

		expect(unlinkMock).toHaveBeenCalledTimes(1);
		expect(deleteWhereMock).toHaveBeenCalledTimes(1);
		expect(result).toEqual({ deletedCount: 1 });
	});
});
