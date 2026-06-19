import type {
	VisioParticipantSummary,
	VisioRoomEvent,
	VisioRoomPageState,
} from "@/features/visio/model/visio.types";

const buildHostPeer = (name: string): VisioParticipantSummary => ({
	participantId: "host",
	displayName: name,
	role: "host",
	status: "active",
});

export const applyVisioRoomPageEvent = (
	state: VisioRoomPageState,
	event: VisioRoomEvent,
): VisioRoomPageState => {
	if (event.type === "room-ended") {
		return {
			status: "ended",
			room: state.status === "ended" ? state.room : state.room,
		};
	}

	if (event.type === "room-updated" && state.status !== "ended") {
		return {
			...state,
			room: {
				...state.room,
				settings: event.settings,
				settingsLocked: event.settingsLocked,
			},
		};
	}

	if (
		state.status === "pending" &&
		event.type === "admission-approved" &&
		event.participant.participantId === state.self.participantId
	) {
		return {
			status: "in_call",
			room: {
				...state.room,
				settingsLocked: true,
			},
			self: {
				...state.self,
				status: "active",
			},
			peer: buildHostPeer(state.room.hostDisplayName),
			pendingGuest: null,
		};
	}

	if (
		state.status === "pending" &&
		event.type === "admission-rejected" &&
		event.participant.participantId === state.self.participantId
	) {
		return {
			status: "rejected",
			room: state.room,
			self: {
				...state.self,
				status: "rejected",
			},
		};
	}

	if (state.status === "in_call") {
		if (event.type === "guest-requested" && state.self.role === "host") {
			return {
				...state,
				room: {
					...state.room,
					settingsLocked: true,
				},
				pendingGuest: event.participant,
			};
		}

		if (event.type === "participant-joined") {
			if (event.participant.participantId === state.self.participantId) {
				return state;
			}

			return {
				...state,
				room: {
					...state.room,
					settingsLocked: true,
				},
				peer: event.participant,
				pendingGuest:
					state.pendingGuest?.participantId === event.participant.participantId
						? null
						: state.pendingGuest,
			};
		}

		if (
			event.type === "admission-rejected" &&
			state.self.role === "host" &&
			state.pendingGuest?.participantId === event.participant.participantId
		) {
			return {
				...state,
				pendingGuest: null,
			};
		}

		if (event.type === "participant-left") {
			if (state.peer?.participantId === event.participant.participantId) {
				return {
					...state,
					peer: null,
				};
			}

			if (
				state.pendingGuest?.participantId === event.participant.participantId
			) {
				return {
					...state,
					pendingGuest: null,
				};
			}
		}
	}

	return state;
};
