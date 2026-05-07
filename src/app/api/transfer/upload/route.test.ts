// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const getTransferUploadFileMock = vi.fn();
const saveUploadedTransferFileMock = vi.fn();

vi.mock("@/server/better-auth", () => ({
	auth: {
		api: {
			getSession: getSessionMock,
		},
	},
}));

vi.mock("@/features/transfer/model/transfer.validation", () => ({
	getTransferUploadFile: getTransferUploadFileMock,
}));

vi.mock("@/features/transfer/model/transfer.service", () => ({
	saveUploadedTransferFile: saveUploadedTransferFileMock,
}));

describe("POST /api/transfer/upload", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("rejects unauthenticated upload requests", async () => {
		getSessionMock.mockResolvedValue(null);
		const { POST } = await import("./route");
		const request = new Request("http://localhost/api/transfer/upload", {
			method: "POST",
			body: new FormData(),
		});

		const response = await POST(request);

		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({
			error: "Connectez-vous pour envoyer des fichiers.",
		});
	});

	it("returns transfer metadata for a valid upload", async () => {
		getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
		getTransferUploadFileMock.mockReturnValue(
			new File(["abc"], "report.pdf", { type: "application/pdf" }),
		);
		saveUploadedTransferFileMock.mockResolvedValue({
			slug: "secret-slug",
			sharePath: "/transfer/secret-slug",
			originalFilename: "report.pdf",
			mimeType: "application/pdf",
			sizeBytes: 3,
			createdAt: "2026-04-03T08:00:00.000Z",
			expiresAt: "2026-04-10T08:00:00.000Z",
		});

		const { POST } = await import("./route");
		const formData = new FormData();
		formData.append(
			"file",
			new File(["abc"], "report.pdf", { type: "application/pdf" }),
		);
		const request = new Request("http://localhost/api/transfer/upload", {
			method: "POST",
			body: formData,
		});

		const response = await POST(request);

		expect(response.status).toBe(201);
		await expect(response.json()).resolves.toMatchObject({
			slug: "secret-slug",
			sharePath: "/transfer/secret-slug",
		});
	});
});
