import { cookies } from "next/headers";

import { env } from "@/env";
import {
	getVisioParticipantCookieName,
	VISIO_ROOM_RETENTION_MS,
} from "@/features/visio/model/visio.constants";
import { createVisioErrorResponse } from "@/features/visio/model/visio.responses";
import { createVisioRoom } from "@/features/visio/model/visio.service";
import { getCreateVisioRoomInput } from "@/features/visio/model/visio.validation";
import { auth } from "@/server/better-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user) {
		return Response.json(
			{ error: "Sign in before creating a visio room." },
			{ status: 401 },
		);
	}

	try {
		const input = await getCreateVisioRoomInput(request);
		const { response, participantToken } = await createVisioRoom({
			hostUserId: session.user.id,
			...input,
		});

		const cookieStore = await cookies();
		cookieStore.set(getVisioParticipantCookieName(response.slug), participantToken, {
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
			"Room creation failed due to a server error.",
			"visio room creation failed",
		);
	}
}
