export const VISIO_ROOM_RETENTION_MS = 24 * 60 * 60 * 1000;
export const VISIO_CLEANUP_CRON_EXPRESSION = "0 * * * *";
export const VISIO_PARTICIPANT_COOKIE_PREFIX = "visio-room";
export const VISIO_DISPLAY_NAME_MIN_LENGTH = 2;
export const VISIO_DISPLAY_NAME_MAX_LENGTH = 40;
export const VISIO_EVENTS_POLL_INTERVAL_MS = 1000;
export const VISIO_EVENTS_HEARTBEAT_INTERVAL_MS = 15000;
export const VISIO_DEFAULT_ICE_SERVERS = [
	{
		urls: ["stun:stun.l.google.com:19302"],
	},
];

export const buildVisioRoomPath = (slug: string) => `/visio/${slug}`;

export const getVisioParticipantCookieName = (slug: string) =>
	`${VISIO_PARTICIPANT_COOKIE_PREFIX}-${slug}`;
