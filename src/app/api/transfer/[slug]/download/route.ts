import { isTransferError } from "@/features/transfer/model/transfer.errors";
import { streamTransferFileBySlug } from "@/features/transfer/model/transfer.service";

export const runtime = "nodejs";

const buildContentDisposition = (filename: string) =>
	`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`;

export async function GET(
	_request: Request,
	context: { params: Promise<{ slug: string }> },
) {
	const { slug } = await context.params;

	try {
		const { transfer, stream } = await streamTransferFileBySlug(slug);

		return new Response(stream as globalThis.ReadableStream<Uint8Array>, {
			headers: {
				"Content-Disposition": buildContentDisposition(
					transfer.originalFilename,
				),
				"Content-Length": transfer.sizeBytes.toString(),
				"Content-Type": transfer.mimeType,
				"Cache-Control": "no-store",
			},
		});
	} catch (error) {
		if (isTransferError(error)) {
			return Response.json(
				{ error: error.message },
				{ status: error.statusCode },
			);
		}

		console.error("transfer download failed", error);
		return Response.json(
			{ error: "Le téléchargement a échoué à cause d'une erreur serveur." },
			{ status: 500 },
		);
	}
}
