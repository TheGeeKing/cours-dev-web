import { isTransferError } from "@/features/transfer/model/transfer.errors";
import { saveUploadedTransferFile } from "@/features/transfer/model/transfer.service";
import { getTransferUploadFile } from "@/features/transfer/model/transfer.validation";
import { auth } from "@/server/better-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user) {
		return Response.json(
			{ error: "Connectez-vous pour envoyer des fichiers." },
			{ status: 401 },
		);
	}

	try {
		const formData = await request.formData();
		const file = getTransferUploadFile(formData);
		const response = await saveUploadedTransferFile({
			file,
			ownerUserId: session.user.id,
		});

		return Response.json(response, { status: 201 });
	} catch (error) {
		if (isTransferError(error)) {
			return Response.json(
				{ error: error.message },
				{ status: error.statusCode },
			);
		}

		console.error("transfer upload failed", error);
		return Response.json(
			{ error: "L'envoi a échoué à cause d'une erreur serveur." },
			{ status: 500 },
		);
	}
}
