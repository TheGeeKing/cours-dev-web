import { cookies } from "next/headers";

import { createVisioErrorResponse } from "@/features/visio/model/visio.responses";
import { updateVisioRoomSettings } from "@/features/visio/model/visio.service";
import { getVisioRoomSettingsInput } from "@/features/visio/model/visio.validation";
import { auth } from "@/server/better-auth";

export const runtime = "nodejs";

export async function PATCH(
	request: Request,
	props: { params: Promise<{ slug: string }> },
) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user) {
		return Response.json(
			{ error: "Connectez-vous avant de modifier les réglages du salon." },
			{ status: 401 },
		);
	}

	try {
		const { slug } = await props.params;
		const input = await getVisioRoomSettingsInput(request);
		const cookieStore = await cookies();
		const response = await updateVisioRoomSettings({
			slug,
			hostUserId: session.user.id,
			hostParticipantToken:
				cookieStore.get(`visio-room-${slug}`)?.value ?? null,
			...input,
		});

		return Response.json(response);
	} catch (error) {
		return createVisioErrorResponse(
			error,
			"Les réglages du salon n'ont pas pu être mis à jour.",
			"visio room settings update failed",
		);
	}
}
