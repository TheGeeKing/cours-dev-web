import { z } from "zod";

import {
	TRANSFER_FILE_FIELD_NAME,
	TRANSFER_MAX_FILE_SIZE_BYTES,
} from "./transfer.constants";
import { TransferError } from "./transfer.errors";

const transferUploadValidationSchema = z.object({
	fileCount: z.number().refine((value) => value === 1, {
		message: "Envoyez exactement un fichier pour créer un lien de transfert.",
	}),
	fileSize: z
		.number()
		.max(
			TRANSFER_MAX_FILE_SIZE_BYTES,
			`Les fichiers doivent faire 100 Mo ou moins.`,
		),
});

export const getTransferUploadFile = (formData: FormData) => {
	const entries = formData.getAll(TRANSFER_FILE_FIELD_NAME);

	const parsedEntryCount = transferUploadValidationSchema.safeParse({
		fileCount: entries.length,
		fileSize:
			entries[0] instanceof File
				? entries[0].size
				: TRANSFER_MAX_FILE_SIZE_BYTES + 1,
	});

	if (!parsedEntryCount.success) {
		throw new TransferError(
			parsedEntryCount.error.issues[0]?.message ??
				"La validation de l'envoi a échoué.",
			400,
			"BAD_REQUEST",
		);
	}

	const [entry] = entries;
	if (!(entry instanceof File)) {
		throw new TransferError("Un fichier est requis.", 400, "BAD_REQUEST");
	}

	return entry;
};
