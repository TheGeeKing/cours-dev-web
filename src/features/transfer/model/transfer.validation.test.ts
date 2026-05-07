// @vitest-environment node

import { describe, expect, it } from "vitest";

import { TRANSFER_FILE_FIELD_NAME } from "@/features/transfer/model/transfer.constants";
import { TransferError } from "@/features/transfer/model/transfer.errors";
import { getTransferUploadFile } from "@/features/transfer/model/transfer.validation";

describe("getTransferUploadFile", () => {
	it("rejects when no file is provided", () => {
		const formData = new FormData();

		expect(() => getTransferUploadFile(formData)).toThrow(TransferError);
		expect(() => getTransferUploadFile(formData)).toThrow(
			"Envoyez exactement un fichier pour créer un lien de transfert.",
		);
	});

	it("rejects when multiple files are provided", () => {
		const formData = new FormData();
		formData.append(TRANSFER_FILE_FIELD_NAME, new File(["a"], "a.txt"));
		formData.append(TRANSFER_FILE_FIELD_NAME, new File(["b"], "b.txt"));

		expect(() => getTransferUploadFile(formData)).toThrow(
			"Envoyez exactement un fichier pour créer un lien de transfert.",
		);
	});

	it("rejects files larger than 100 MB", () => {
		const formData = new FormData();
		const oversizedFile = {
			size: 100 * 1024 * 1024 + 1,
			name: "huge.bin",
			type: "application/octet-stream",
		} as File;

		formData.append(TRANSFER_FILE_FIELD_NAME, oversizedFile);

		expect(() => getTransferUploadFile(formData)).toThrow(
			"Les fichiers doivent faire 100 Mo ou moins.",
		);
	});
});
