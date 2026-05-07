// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { TransferError } from "@/features/transfer/model/transfer.errors";

const streamTransferFileBySlugMock = vi.fn();

vi.mock("@/features/transfer/model/transfer.service", () => ({
	streamTransferFileBySlug: streamTransferFileBySlugMock,
}));

describe("GET /api/transfer/[slug]/download", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("returns a download response for a valid slug", async () => {
		streamTransferFileBySlugMock.mockResolvedValue({
			transfer: {
				originalFilename: "report.pdf",
				mimeType: "application/pdf",
				sizeBytes: 3,
			},
			stream: new ReadableStream<Uint8Array>({
				start(controller) {
					controller.enqueue(new TextEncoder().encode("abc"));
					controller.close();
				},
			}),
		});

		const { GET } = await import("./route");
		const response = await GET(new Request("http://localhost"), {
			params: Promise.resolve({ slug: "secret-slug" }),
		});

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("application/pdf");
		expect(response.headers.get("Content-Disposition")).toContain("report.pdf");
	});

	it("fails safely for expired or missing transfers", async () => {
		streamTransferFileBySlugMock.mockRejectedValue(
			new TransferError("Lien de transfert expiré.", 410, "EXPIRED"),
		);

		const { GET } = await import("./route");
		const response = await GET(new Request("http://localhost"), {
			params: Promise.resolve({ slug: "expired-slug" }),
		});

		expect(response.status).toBe(410);
		await expect(response.json()).resolves.toEqual({
			error: "Lien de transfert expiré.",
		});
	});
});
