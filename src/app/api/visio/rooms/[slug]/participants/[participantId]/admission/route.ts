import { cookies } from "next/headers";

import { getVisioParticipantCookieName } from "@/features/visio/model/visio.constants";
import { createVisioErrorResponse } from "@/features/visio/model/visio.responses";
import { reviewVisioGuestAdmission } from "@/features/visio/model/visio.service";
import { getVisioAdmissionInput } from "@/features/visio/model/visio.validation";
import { auth } from "@/server/better-auth";

export const runtime = "nodejs";

export async function POST(
	request: Request,
	props: { params: Promise<{ slug: string; participantId: string }> },
) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user) {
		return Response.json(
			{ error: "Sign in before reviewing guest access." },
			{ status: 401 },
		);
	}

	try {
		const { slug, participantId } = await props.params;
		const input = await getVisioAdmissionInput(request);
		const cookieStore = await cookies();
		const response = await reviewVisioGuestAdmission({
			slug,
			hostUserId: session.user.id,
			hostParticipantToken:
				cookieStore.get(getVisioParticipantCookieName(slug))?.value ?? null,
			participantId,
			decision: input.decision,
		});

		return Response.json(response);
	} catch (error) {
		return createVisioErrorResponse(
			error,
			"Guest review failed due to a server error.",
			"visio guest admission failed",
		);
	}
}
