import { cookies } from "next/headers";

import { getVisioParticipantCookieName } from "@/features/visio/model/visio.constants";
import { createVisioErrorResponse } from "@/features/visio/model/visio.responses";
import { sendVisioSignal } from "@/features/visio/model/visio.service";
import { getVisioSignalInput } from "@/features/visio/model/visio.validation";
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
		const input = await getVisioSignalInput(request);
		const cookieStore = await cookies();

		await sendVisioSignal({
			slug,
			viewerUserId: session?.user.id ?? null,
			participantToken:
				cookieStore.get(getVisioParticipantCookieName(slug))?.value ?? null,
			payload: input,
		});

		return Response.json({ ok: true }, { status: 202 });
	} catch (error) {
		return createVisioErrorResponse(
			error,
			"Signal delivery failed due to a server error.",
			"visio signal failed",
		);
	}
}
