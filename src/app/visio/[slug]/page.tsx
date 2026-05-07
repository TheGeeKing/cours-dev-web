import { cookies } from "next/headers";

import { getVisioParticipantCookieName } from "@/features/visio/model/visio.constants";
import {
	getVisioIceServers,
	getVisioRoomPageState,
} from "@/features/visio/model/visio.service";
import { VisioRoomShell } from "@/features/visio/view/visio-room-shell";
import { getSession } from "@/server/better-auth/server";

export default async function VisioRoomPage(props: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await props.params;
	const session = await getSession();
	const cookieStore = await cookies();
	const state = await getVisioRoomPageState({
		slug,
		viewerUserId: session?.user.id ?? null,
		participantToken:
			cookieStore.get(getVisioParticipantCookieName(slug))?.value ?? null,
	});

	return (
		<VisioRoomShell
			iceServers={getVisioIceServers()}
			initialState={state}
			roomSlug={slug}
		/>
	);
}
