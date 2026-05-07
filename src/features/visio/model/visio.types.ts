export type VisioRole = "host" | "guest";
export type VisioParticipantStatus = "active" | "pending" | "rejected" | "left";
export type VisioSignalType =
	| "offer"
	| "answer"
	| "ice-candidate"
	| "ready"
	| "hangup";

export type VisioRoomSettings = {
	requireJoinAuth: boolean;
	requireWaitingRoom: boolean;
};

export type VisioRoomSummary = {
	slug: string;
	sharePath: string;
	hostDisplayName: string;
	settings: VisioRoomSettings;
	settingsLocked: boolean;
	expiresAt: string;
};

export type VisioParticipantSummary = {
	participantId: string;
	displayName: string;
	role: VisioRole;
	status: VisioParticipantStatus;
};

export type VisioIceServer = {
	urls: string | string[];
	username?: string;
	credential?: string;
};

export type VisioSignalPayload =
	| {
			signalType: "offer";
			data: RTCSessionDescriptionInit;
	  }
	| {
			signalType: "answer";
			data: RTCSessionDescriptionInit;
	  }
	| {
			signalType: "ice-candidate";
			data: RTCIceCandidateInit;
	  }
	| {
			signalType: "ready";
			data: null;
	  }
	| {
			signalType: "hangup";
			data: null;
	  };

export type VisioRoomEvent =
	| {
			id: number;
			type: "guest-requested";
			participant: VisioParticipantSummary;
	  }
	| {
			id: number;
			type: "participant-joined";
			participant: VisioParticipantSummary;
	  }
	| {
			id: number;
			type: "admission-approved";
			participant: VisioParticipantSummary;
	  }
	| {
			id: number;
			type: "admission-rejected";
			participant: VisioParticipantSummary;
	  }
	| {
			id: number;
			type: "participant-left";
			participant: VisioParticipantSummary;
	  }
	| {
			id: number;
			type: "room-updated";
			settings: VisioRoomSettings;
			settingsLocked: boolean;
	  }
	| {
			id: number;
			type: "room-ended";
	  }
	| ({
			id: number;
			type: "signal";
			participant: VisioParticipantSummary;
	  } & VisioSignalPayload);

export type VisioJoinableState = {
	status: "joinable";
	room: VisioRoomSummary;
	viewerSignedIn: boolean;
	viewerCanJoin: boolean;
};

export type VisioPendingState = {
	status: "pending";
	room: VisioRoomSummary;
	self: VisioParticipantSummary;
};

export type VisioInCallState = {
	status: "in_call";
	room: VisioRoomSummary;
	self: VisioParticipantSummary;
	peer: VisioParticipantSummary | null;
	pendingGuest: VisioParticipantSummary | null;
};

export type VisioFullState = {
	status: "full";
	room: VisioRoomSummary;
	occupant: VisioParticipantSummary | null;
};

export type VisioRejectedState = {
	status: "rejected";
	room: VisioRoomSummary;
	self: VisioParticipantSummary;
};

export type VisioEndedState = {
	status: "ended";
	room: VisioRoomSummary | null;
};

export type VisioExpiredState = {
	status: "expired";
	room: VisioRoomSummary;
};

export type VisioRoomPageState =
	| VisioJoinableState
	| VisioPendingState
	| VisioInCallState
	| VisioFullState
	| VisioRejectedState
	| VisioEndedState
	| VisioExpiredState;

export type VisioCreateRoomResponse = {
	slug: string;
	sharePath: string;
	hostDisplayName: string;
	settings: VisioRoomSettings;
	expiresAt: string;
};

export type VisioJoinRoomResponse = {
	status: "pending" | "in_call";
	sharePath: string;
	participant: VisioParticipantSummary;
};

export type VisioRoomSettingsResponse = {
	settings: VisioRoomSettings;
	settingsLocked: boolean;
};
