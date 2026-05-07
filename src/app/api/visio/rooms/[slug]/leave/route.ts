import { cookies } from "next/headers";

import { getVisioParticipantCookieName } from "@/features/visio/model/visio.constants";
import { createVisioErrorResponse } from "@/features/visio/model/visio.responses";
import { leaveVisioRoom } from "@/features/visio/model/visio.service";
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
		const cookieStore = await cookies();
		const response = await leaveVisioRoom({
			slug,
			viewerUserId: session?.user.id ?? null,
			participantToken:
				cookieStore.get(getVisioParticipantCookieName(slug))?.value ?? null,
		});

		cookieStore.set(getVisioParticipantCookieName(slug), "", {
			path: "/",
			maxAge: 0,
		});

		return Response.json(response);
	} catch (error) {
		return createVisioErrorResponse(
			error,
			"Leaving the room failed due to a server error.",
			"visio leave failed",
		);
	}
}
