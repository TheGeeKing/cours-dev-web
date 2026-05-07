import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VisioRoomShell } from "./visio-room-shell";

const { useVisioRoomViewModelMock } = vi.hoisted(() => ({
	useVisioRoomViewModelMock: vi.fn(),
}));

vi.mock("@/features/visio/view-model/use-visio-room-view-model", () => ({
	useVisioRoomViewModel: useVisioRoomViewModelMock,
}));

const buildViewModelMock = (overrides: Record<string, unknown> = {}) => ({
	error: null,
	notice: null,
	joinName: "",
	setJoinName: vi.fn(),
	isBusy: false,
	isCopied: false,
	handleCopyLink: vi.fn(),
	handleJoinSubmit: vi.fn(),
	handleSignIn: vi.fn(),
	handleStartPreview: vi.fn(),
	handleStopPreview: vi.fn(),
	handleRefreshDevices: vi.fn(),
	handleSelectAudioInput: vi.fn(),
	handleSelectVideoInput: vi.fn(),
	handleSelectAudioOutput: vi.fn(),
	handleTestSpeaker: vi.fn(),
	handleToggleTrack: vi.fn(),
	handleLeave: vi.fn(),
	handleAdmissionDecision: vi.fn(),
	settingsDraft: null,
	setSettingsDraft: vi.fn(),
	handleSettingsSubmit: vi.fn(),
	previewVideoRef: { current: null },
	localVideoRef: { current: null },
	remoteVideoRef: { current: null },
	speakerTestAudioRef: { current: null },
	previewStatus: "idle",
	isMicEnabled: true,
	isCameraEnabled: true,
	connectionState: "waiting",
	hasLocalMedia: false,
	hasRemoteMedia: false,
	hasLocalAudioTrack: false,
	hasLocalVideoTrack: false,
	audioInputOptions: [
		{ deviceId: "mic-1", label: "Microphone 1", kind: "audioinput" },
	],
	audioInputExposure: "available",
	videoInputOptions: [
		{ deviceId: "cam-1", label: "Camera 1", kind: "videoinput" },
	],
	videoInputExposure: "available",
	audioOutputOptions: [
		{ deviceId: "speaker-1", label: "Speaker 1", kind: "audiooutput" },
	],
	audioOutputExposure: "available",
	selectedAudioInputId: "mic-1",
	selectedVideoInputId: "cam-1",
	selectedAudioOutputId: "speaker-1",
	hasRequestedDeviceAccess: false,
	isSpeakerSelectionSupported: true,
	isSpeakerTestSupported: true,
	isTestingSpeaker: false,
	micLevel: 0.25,
	...overrides,
});

describe("VisioRoomShell", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("shows the auth gate and device panel when the room requires sign-in", () => {
		useVisioRoomViewModelMock.mockReturnValue(
			buildViewModelMock({
				state: {
					status: "joinable",
					room: {
						slug: "room-slug",
						sharePath: "/visio/room-slug",
						hostDisplayName: "Host",
						settings: {
							requireJoinAuth: true,
							requireWaitingRoom: false,
						},
						settingsLocked: false,
						expiresAt: "2026-04-04T08:00:00.000Z",
					},
					viewerSignedIn: false,
					viewerCanJoin: false,
				},
				isSpeakerSelectionSupported: false,
				isSpeakerTestSupported: false,
			}),
		);

		render(
			<VisioRoomShell
				iceServers={[]}
				initialState={{
					status: "joinable",
					room: {
						slug: "room-slug",
						sharePath: "/visio/room-slug",
						hostDisplayName: "Host",
						settings: {
							requireJoinAuth: true,
							requireWaitingRoom: false,
						},
						settingsLocked: false,
						expiresAt: "2026-04-04T08:00:00.000Z",
					},
					viewerSignedIn: false,
					viewerCanJoin: false,
				}}
				roomSlug="room-slug"
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Sign in with GitHub" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("heading", {
				name: "Test your setup before the call.",
			}),
		).toBeInTheDocument();
		expect(
			screen.getByText("Speaker output selection is not supported in this browser."),
		).toBeInTheDocument();
	});

	it("shows waiting room controls for the host when a guest is pending", () => {
		useVisioRoomViewModelMock.mockReturnValue(
			buildViewModelMock({
				state: {
					status: "in_call",
					room: {
						slug: "room-slug",
						sharePath: "/visio/room-slug",
						hostDisplayName: "Host",
						settings: {
							requireJoinAuth: false,
							requireWaitingRoom: true,
						},
						settingsLocked: true,
						expiresAt: "2026-04-04T08:00:00.000Z",
					},
					self: {
						participantId: "host-1",
						displayName: "Host",
						role: "host",
						status: "active",
					},
					peer: null,
					pendingGuest: {
						participantId: "guest-1",
						displayName: "Guest",
						role: "guest",
						status: "pending",
					},
				},
			}),
		);

		render(
			<VisioRoomShell
				iceServers={[]}
				initialState={{
					status: "in_call",
					room: {
						slug: "room-slug",
						sharePath: "/visio/room-slug",
						hostDisplayName: "Host",
						settings: {
							requireJoinAuth: false,
							requireWaitingRoom: true,
						},
						settingsLocked: true,
						expiresAt: "2026-04-04T08:00:00.000Z",
					},
					self: {
						participantId: "host-1",
						displayName: "Host",
						role: "host",
						status: "active",
					},
					peer: null,
					pendingGuest: {
						participantId: "guest-1",
						displayName: "Guest",
						role: "guest",
						status: "pending",
					},
				}}
				roomSlug="room-slug"
			/>,
		);

		expect(
			screen.getByRole("button", { name: "Approve guest" }),
		).toBeInTheDocument();
		expect(screen.getAllByRole("button", { name: "Test speaker" }).length).toBe(
			2,
		);
	});
});
