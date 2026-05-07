import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useVisioRoomViewModel } from "./use-visio-room-view-model";

const { refreshMock, signInSocialMock } = vi.hoisted(() => ({
	refreshMock: vi.fn(),
	signInSocialMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		refresh: refreshMock,
	}),
}));

vi.mock("@/server/better-auth/client", () => ({
	authClient: {
		signIn: {
			social: signInSocialMock,
		},
	},
}));

type FakeTrack = MediaStreamTrack & {
	deviceId: string;
	stopMock: ReturnType<typeof vi.fn>;
};

type FakeStream = MediaStream & {
	audioTracks: FakeTrack[];
	videoTracks: FakeTrack[];
};

type MockSender = RTCRtpSender & {
	kind: "audio" | "video";
	replaceTrackMock: ReturnType<typeof vi.fn>;
	track: MediaStreamTrack | null;
};

let mediaDevicesListeners: Record<string, (() => void) | undefined> = {};

class MockEventSource {
	addEventListener = vi.fn();
	close = vi.fn();
	onerror: (() => void) | null = null;

	constructor(public readonly url: string) {}
}

class MockPeerConnection {
	static instances: MockPeerConnection[] = [];

	onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null = null;
	ontrack: ((event: RTCTrackEvent) => void) | null = null;
	onconnectionstatechange: (() => void) | null = null;
	connectionState: RTCPeerConnectionState = "new";
	signalingState: RTCSignalingState = "stable";
	localDescription: RTCSessionDescriptionInit | null = null;
	remoteDescription: RTCSessionDescriptionInit | null = null;
	senders: MockSender[] = [];
	close = vi.fn();
	createAnswer = vi.fn(async () => ({ type: "answer", sdp: "answer-sdp" }));
	createOffer = vi.fn(async () => ({ type: "offer", sdp: "offer-sdp" }));
	addIceCandidate = vi.fn(async () => undefined);
	setLocalDescription = vi.fn(async (description: RTCSessionDescriptionInit) => {
		this.localDescription = description;
	});
	setRemoteDescription = vi.fn(async (description: RTCSessionDescriptionInit) => {
		this.remoteDescription = description;
	});

	constructor(public readonly configuration: RTCConfiguration) {
		MockPeerConnection.instances.push(this);
	}

	addTrack(track: MediaStreamTrack, _stream: MediaStream) {
		const replaceTrackMock = vi.fn(async (nextTrack: MediaStreamTrack | null) => {
			sender.track = nextTrack;
		});
		const sender = {
			kind: track.kind as "audio" | "video",
			track,
			replaceTrack: replaceTrackMock,
			replaceTrackMock,
		} as MockSender;

		this.senders.push(sender);
		return sender;
	}

	getSenders() {
		return this.senders;
	}
}

const createTrack = (kind: "audio" | "video", deviceId: string): FakeTrack => {
	const stopMock = vi.fn();

	return {
		kind,
		enabled: true,
		deviceId,
		stop: stopMock,
		stopMock,
		getSettings: () => ({ deviceId }),
	} as unknown as FakeTrack;
};

const createStream = (input: {
	audioDeviceId?: string | null;
	videoDeviceId?: string | null;
}): FakeStream => {
	const audioTracks = input.audioDeviceId ? [createTrack("audio", input.audioDeviceId)] : [];
	const videoTracks = input.videoDeviceId ? [createTrack("video", input.videoDeviceId)] : [];

	return {
		audioTracks,
		videoTracks,
		getTracks: () => [...audioTracks, ...videoTracks],
		getAudioTracks: () => audioTracks,
		getVideoTracks: () => videoTracks,
	} as unknown as FakeStream;
};

const createDevices = (overrides?: {
	audioInputs?: string[];
	videoInputs?: string[];
	audioOutputs?: string[];
}) => {
	const audioInputs = overrides?.audioInputs ?? ["mic-1", "mic-2"];
	const videoInputs = overrides?.videoInputs ?? ["cam-1", "cam-2"];
	const audioOutputs = overrides?.audioOutputs ?? ["speaker-1"];

	return [
		...audioInputs.map(
			(deviceId, index) =>
				({
					deviceId,
					kind: "audioinput",
					label: `Microphone ${index + 1}`,
				}) as MediaDeviceInfo,
		),
		...videoInputs.map(
			(deviceId, index) =>
				({
					deviceId,
					kind: "videoinput",
					label: `Camera ${index + 1}`,
				}) as MediaDeviceInfo,
		),
		...audioOutputs.map(
			(deviceId, index) =>
				({
					deviceId,
					kind: "audiooutput",
					label: `Speaker ${index + 1}`,
				}) as MediaDeviceInfo,
		),
	];
};

const createJoinableState = () =>
	({
		status: "joinable",
		room: {
			slug: "room-slug",
			sharePath: "/visio/room-slug",
			hostDisplayName: "Host",
			settings: {
				requireJoinAuth: false,
				requireWaitingRoom: false,
			},
			settingsLocked: false,
			expiresAt: "2026-04-04T08:00:00.000Z",
		},
		viewerSignedIn: true,
		viewerCanJoin: true,
	}) as const;

const createInCallState = (peer: {
	participantId: string;
	displayName: string;
	role: "host" | "guest";
	status: "active";
} | null) =>
	({
		status: "in_call",
		room: {
			slug: "room-slug",
			sharePath: "/visio/room-slug",
			hostDisplayName: "Host",
			settings: {
				requireJoinAuth: false,
				requireWaitingRoom: false,
			},
			settingsLocked: true,
			expiresAt: "2026-04-04T08:00:00.000Z",
		},
		self: {
			participantId: "guest-1",
			displayName: "Guest",
			role: "guest",
			status: "active",
		},
		peer,
		pendingGuest: null,
	}) as const;

describe("useVisioRoomViewModel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		MockPeerConnection.instances = [];
		mediaDevicesListeners = {};

		Object.defineProperty(globalThis, "EventSource", {
			configurable: true,
			value: MockEventSource,
		});
		Object.defineProperty(globalThis, "RTCPeerConnection", {
			configurable: true,
			value: MockPeerConnection,
		});

		Object.defineProperty(HTMLMediaElement.prototype, "pause", {
			configurable: true,
			value: vi.fn(),
		});
		Object.defineProperty(HTMLMediaElement.prototype, "play", {
			configurable: true,
			value: vi.fn(async () => undefined),
		});
		Object.defineProperty(HTMLMediaElement.prototype, "setSinkId", {
			configurable: true,
			value: undefined,
		});

		Object.defineProperty(navigator, "mediaDevices", {
			configurable: true,
			value: {
				getUserMedia: vi.fn(),
				enumerateDevices: vi.fn(async () => createDevices()),
				addEventListener: vi.fn((eventName: string, listener: () => void) => {
					mediaDevicesListeners[eventName] = listener;
				}),
				removeEventListener: vi.fn((eventName: string) => {
					delete mediaDevicesListeners[eventName];
				}),
			},
		});

		Object.defineProperty(globalThis, "fetch", {
			configurable: true,
			value: vi.fn(async () => ({
				ok: true,
				json: async () => ({}),
			})),
		});
	});

	it("starts preview before join without sending any signal", async () => {
		const getUserMediaMock = vi.mocked(navigator.mediaDevices.getUserMedia);
		getUserMediaMock.mockResolvedValue(createStream({
			audioDeviceId: "mic-1",
			videoDeviceId: "cam-1",
		}));
		const fetchMock = vi.mocked(fetch);

		const { result } = renderHook(() =>
			useVisioRoomViewModel({
				initialState: createJoinableState(),
				roomSlug: "room-slug",
				iceServers: [],
			}),
		);

		await waitFor(() => {
			expect(result.current.selectedAudioInputId).toBe("mic-1");
			expect(result.current.selectedVideoInputId).toBe("cam-1");
		});

		await act(async () => {
			await result.current.handleStartPreview();
		});

		expect(getUserMediaMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).not.toHaveBeenCalled();
		expect(result.current.previewStatus).toBe("ready");
		expect(result.current.hasLocalMedia).toBe(true);
	});

	it("waits for a peer before announcing local readiness", async () => {
		const getUserMediaMock = vi.mocked(navigator.mediaDevices.getUserMedia);
		getUserMediaMock.mockResolvedValue(createStream({
			audioDeviceId: "mic-1",
			videoDeviceId: "cam-1",
		}));
		const fetchMock = vi.mocked(fetch);

		const { result, rerender } = renderHook(
			(props: {
				initialState: ReturnType<typeof createInCallState>;
				roomSlug: string;
				iceServers: [];
			}) => useVisioRoomViewModel(props),
			{
				initialProps: {
					initialState: createInCallState(null),
					roomSlug: "room-slug",
					iceServers: [],
				},
			},
		);

		await waitFor(() => {
			expect(result.current.selectedAudioInputId).toBe("mic-1");
		});

		await act(async () => {
			await result.current.handleStartPreview();
		});

		expect(fetchMock).not.toHaveBeenCalled();
		expect(result.current.error).toBeNull();

		rerender({
			initialState: createInCallState({
				participantId: "host-1",
				displayName: "Host",
				role: "host",
				status: "active",
			}),
			roomSlug: "room-slug",
			iceServers: [],
		});

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledTimes(1);
		});

		expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/visio/rooms/room-slug/signals");
		expect(
			JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).signalType,
		).toBe("ready");
	});

	it("reacquires media and replaces peer tracks when camera or microphone changes", async () => {
		const firstStream = createStream({
			audioDeviceId: "mic-1",
			videoDeviceId: "cam-1",
		});
		const secondStream = createStream({
			audioDeviceId: "mic-2",
			videoDeviceId: "cam-1",
		});
		const thirdStream = createStream({
			audioDeviceId: "mic-2",
			videoDeviceId: "cam-2",
		});
		const getUserMediaMock = vi.mocked(navigator.mediaDevices.getUserMedia);
		getUserMediaMock
			.mockResolvedValueOnce(firstStream)
			.mockResolvedValueOnce(secondStream)
			.mockResolvedValueOnce(thirdStream);

		const { result } = renderHook(() =>
			useVisioRoomViewModel({
				initialState: createInCallState({
					participantId: "host-1",
					displayName: "Host",
					role: "host",
					status: "active",
				}),
				roomSlug: "room-slug",
				iceServers: [],
			}),
		);

		await waitFor(() => {
			expect(result.current.selectedAudioInputId).toBe("mic-1");
			expect(result.current.selectedVideoInputId).toBe("cam-1");
		});

		await act(async () => {
			await result.current.handleStartPreview();
		});

		const peerConnection = MockPeerConnection.instances[0];
		expect(peerConnection).toBeDefined();
		const audioSender = peerConnection!.senders.find(
			(sender) => sender.kind === "audio",
		);
		const videoSender = peerConnection!.senders.find(
			(sender) => sender.kind === "video",
		);

		expect(audioSender).toBeDefined();
		expect(videoSender).toBeDefined();

		await act(async () => {
			await result.current.handleSelectAudioInput("mic-2");
		});

		expect(
			getUserMediaMock.mock.calls[1]?.[0],
		).toMatchObject({
			audio: {
				deviceId: {
					exact: "mic-2",
				},
			},
			video: {
				deviceId: {
					exact: "cam-1",
				},
			},
		});
		expect(audioSender!.replaceTrackMock).toHaveBeenCalled();

		await act(async () => {
			await result.current.handleSelectVideoInput("cam-2");
		});

		expect(
			getUserMediaMock.mock.calls[2]?.[0],
		).toMatchObject({
			audio: {
				deviceId: {
					exact: "mic-2",
				},
			},
			video: {
				deviceId: {
					exact: "cam-2",
				},
			},
		});
		expect(videoSender!.replaceTrackMock).toHaveBeenCalled();
		expect(result.current.hasLocalMedia).toBe(true);
	});

	it("marks speaker output selection as unsupported when setSinkId is unavailable", async () => {
		const { result } = renderHook(() =>
			useVisioRoomViewModel({
				initialState: createJoinableState(),
				roomSlug: "room-slug",
				iceServers: [],
			}),
		);

		await waitFor(() => {
			expect(result.current.selectedAudioOutputId).toBe("speaker-1");
		});

		expect(result.current.isSpeakerSelectionSupported).toBe(false);
		expect(result.current.isSpeakerTestSupported).toBe(false);
	});

	it("falls back to a valid device when the selected hardware disappears", async () => {
		const enumerateDevicesMock = vi.mocked(navigator.mediaDevices.enumerateDevices);
		enumerateDevicesMock
			.mockResolvedValueOnce(createDevices())
			.mockResolvedValueOnce(
				createDevices({
					videoInputs: ["cam-1"],
				}),
			);

		const { result } = renderHook(() =>
			useVisioRoomViewModel({
				initialState: createJoinableState(),
				roomSlug: "room-slug",
				iceServers: [],
			}),
		);

		await waitFor(() => {
			expect(result.current.selectedVideoInputId).toBe("cam-1");
		});

		await act(async () => {
			await result.current.handleSelectVideoInput("cam-2");
		});

		expect(result.current.selectedVideoInputId).toBe("cam-2");

		await act(async () => {
			mediaDevicesListeners.devicechange?.();
		});

		await waitFor(() => {
			expect(result.current.selectedVideoInputId).toBe("cam-1");
			expect(result.current.videoInputOptions).toHaveLength(1);
		});
	});
});
