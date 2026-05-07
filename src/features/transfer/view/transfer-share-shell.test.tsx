import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TransferShareShell } from "./transfer-share-shell";

describe("TransferShareShell", () => {
	it("renders file details for an active transfer", () => {
		render(
			<TransferShareShell
				state={{
					status: "ready",
					transfer: {
						slug: "secret-slug",
						sharePath: "/transfer/secret-slug",
						downloadPath: "/api/transfer/secret-slug/download",
						originalFilename: "report.pdf",
						mimeType: "application/pdf",
						sizeBytes: 3,
						createdAt: new Date("2026-04-03T08:00:00.000Z"),
						expiresAt: new Date("2026-04-10T08:00:00.000Z"),
					},
				}}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: "report.pdf" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Télécharger le fichier" }),
		).toBeInTheDocument();
	});

	it("renders the expired state clearly", () => {
		render(
			<TransferShareShell
				state={{
					status: "expired",
					originalFilename: "report.pdf",
					expiredAt: new Date("2026-04-10T08:00:00.000Z"),
				}}
			/>,
		);

		expect(
			screen.getByRole("heading", { name: "Ce lien de transfert a expiré." }),
		).toBeInTheDocument();
	});
});
