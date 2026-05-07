import { cookies } from "next/headers";

import {
	getVisioParticipantCookieName,
	VISIO_EVENTS_HEARTBEAT_INTERVAL_MS,
	VISIO_EVENTS_POLL_INTERVAL_MS,
} from "@/features/visio/model/visio.constants";
import { getVisioEventsSince, getVisioStreamContext } from "@/features/visio/model/visio.service";
import { isVisioError } from "@/features/visio/model/visio.errors";
import { auth } from "@/server/better-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
	request: Request,
	props: { params: Promise<{ slug: string }> },
) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	try {
		const { slug } = await props.params;
		const cookieStore = await cookies();
		const streamContext = await getVisioStreamContext({
			slug,
			viewerUserId: session?.user.id ?? null,
			participantToken:
				cookieStore.get(getVisioParticipantCookieName(slug))?.value ?? null,
		});
		const encoder = new TextEncoder();
		const url = new URL(request.url);
		const lastEventIdHeader = request.headers.get("last-event-id");
		let lastEventId = Number(
			lastEventIdHeader ?? url.searchParams.get("lastEventId") ?? "0",
		);

		const stream = new ReadableStream({
			start(controller) {
				let closed = false;

				const writeChunk = (value: string) => {
					if (!closed) {
						controller.enqueue(encoder.encode(value));
					}
				};

				const poll = async () => {
					try {
						const events = await getVisioEventsSince({
							roomId: streamContext.room.id,
							participantId: streamContext.participant.id,
							afterEventId: lastEventId,
						});

						for (const event of events) {
							lastEventId = event.id;
							writeChunk(`id: ${event.id}\n`);
							writeChunk("event: visio\n");
							writeChunk(`data: ${JSON.stringify(event)}\n\n`);
						}
					} catch (error) {
						if (isVisioError(error)) {
							writeChunk("event: visio-error\n");
							writeChunk(
								`data: ${JSON.stringify({ error: error.message, code: error.code })}\n\n`,
							);
						}
						cleanup();
						controller.close();
					}
				};

				const pollInterval = setInterval(() => {
					void poll();
				}, VISIO_EVENTS_POLL_INTERVAL_MS);
				const heartbeatInterval = setInterval(() => {
					writeChunk(": keep-alive\n\n");
				}, VISIO_EVENTS_HEARTBEAT_INTERVAL_MS);

				const cleanup = () => {
					if (closed) {
						return;
					}
					closed = true;
					clearInterval(pollInterval);
					clearInterval(heartbeatInterval);
					request.signal.removeEventListener("abort", handleAbort);
				};

				const handleAbort = () => {
					cleanup();
					controller.close();
				};

				request.signal.addEventListener("abort", handleAbort);
				writeChunk("retry: 1000\n");
				writeChunk(": connected\n\n");
				void poll();
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream; charset=utf-8",
				"Cache-Control": "no-cache, no-transform",
				Connection: "keep-alive",
			},
		});
	} catch (error) {
		if (isVisioError(error)) {
			return Response.json(
				{
					error: error.message,
					code: error.code,
				},
				{ status: error.statusCode },
			);
		}

		console.error("visio events stream failed", error);
		return Response.json(
			{ error: "Streaming the room events failed." },
			{ status: 500 },
		);
	}
}
