import { cookies } from "next/headers";

import { env } from "@/env";
import {
	getVisioParticipantCookieName,
	VISIO_ROOM_RETENTION_MS,
} from "@/features/visio/model/visio.constants";
import { createVisioErrorResponse } from "@/features/visio/model/visio.responses";
import { joinVisioRoom } from "@/features/visio/model/visio.service";
import { getJoinVisioRoomInput } from "@/features/visio/model/visio.validation";
import { auth } from "@/server/better-auth";

export const runtime = "nodejs";

export async function POST(
	request: Request,
	props: { params: Promise<{ slug: string }> },
) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	try {
		const { slug } = await props.params;
		const input = await getJoinVisioRoomInput(request);
		const cookieStore = await cookies();
		const { response, participantToken } = await joinVisioRoom({
			slug,
			displayName: input.displayName,
			linkedUserId: session?.user.id ?? null,
			participantToken:
				cookieStore.get(getVisioParticipantCookieName(slug))?.value ?? null,
		});

		cookieStore.set(getVisioParticipantCookieName(slug), participantToken, {
			httpOnly: true,
			sameSite: "lax",
			secure: env.NODE_ENV === "production",
			path: "/",
			maxAge: VISIO_ROOM_RETENTION_MS / 1000,
		});

		return Response.json(response, { status: 201 });
	} catch (error) {
		return createVisioErrorResponse(
			error,
			"L'entrée dans le salon a échoué à cause d'une erreur serveur.",
			"visio room join failed",
		);
	}
}
