"use client";

import { useRouter } from "next/navigation";
import {
	useEffect,
	useEffectEvent,
	useRef,
	useState,
	useTransition,
} from "react";

import { applyVisioRoomPageEvent } from "@/features/visio/model/visio.room-state";
import type {
	VisioIceServer,
	VisioRoomEvent,
	VisioRoomPageState,
	VisioRoomSettings,
	VisioSignalPayload,
} from "@/features/visio/model/visio.types";
import { authClient } from "@/server/better-auth/client";

type MediaStatus = "idle" | "requesting" | "ready" | "unsupported";
type DeviceKind = "audioinput" | "videoinput" | "audiooutput";

type DeviceOption = {
	deviceId: string;
	label: string;
	kind: DeviceKind;
};

type DeviceExposureState = "unknown" | "available" | "unavailable";

type AudioContextConstructor = typeof AudioContext;
type SinkIdMediaElement = HTMLMediaElement & {
	setSinkId?: (sinkId: string) => Promise<void>;
};
type MediaStreamAudioMonitor = {
	audioContext: AudioContext;
	analyser: AnalyserNode;
	source: MediaStreamAudioSourceNode;
	frameId: number;
};

const ensureVideoPlayback = async (element: HTMLVideoElement | null) => {
	if (!element?.srcObject) {
		return;
	}

	try {
		await element.play();
	} catch {
		// Some mobile browsers gate autoplay until the next user gesture.
	}
};

const areRoomSettingsEqual = (
	left: VisioRoomSettings | null,
	right: VisioRoomSettings | null,
) => {
	if (left === right) {
		return true;
	}

	if (!left || !right) {
		return false;
	}

	return (
		left.requireJoinAuth === right.requireJoinAuth &&
		left.requireWaitingRoom === right.requireWaitingRoom
	);
};

const areParticipantsEqual = (
	left: VisioParticipantSummary | null,
	right: VisioParticipantSummary | null,
) => {
	if (left === right) {
		return true;
	}

	if (!left || !right) {
		return false;
	}

	return (
		left.participantId === right.participantId &&
		left.displayName === right.displayName &&
		left.role === right.role &&
		left.status === right.status
	);
};

const areRoomsEqual = (
	left: VisioRoomPageState["room"],
	right: VisioRoomPageState["room"],
) => {
	if (left === right) {
		return true;
	}

	if (!left || !right) {
		return false;
	}

	return (
		left.slug === right.slug &&
		left.sharePath === right.sharePath &&
		left.hostDisplayName === right.hostDisplayName &&
		left.settingsLocked === right.settingsLocked &&
		left.expiresAt === right.expiresAt &&
		areRoomSettingsEqual(left.settings, right.settings)
	);
};

const areRoomPageStatesEqual = (
	left: VisioRoomPageState,
	right: VisioRoomPageState,
) => {
	if (left === right) {
		return true;
	}

	if (left.status !== right.status || !areRoomsEqual(left.room, right.room)) {
		return false;
	}

	switch (left.status) {
		case "joinable":
			return (
				right.status === "joinable" &&
				left.viewerSignedIn === right.viewerSignedIn &&
				left.viewerCanJoin === right.viewerCanJoin
			);
		case "pending":
			return (
				right.status === "pending" &&
				areParticipantsEqual(left.self, right.self)
			);
		case "in_call":
			return (
				right.status === "in_call" &&
				areParticipantsEqual(left.self, right.self) &&
				areParticipantsEqual(left.peer, right.peer) &&
				areParticipantsEqual(left.pendingGuest, right.pendingGuest)
			);
		case "full":
			return (
				right.status === "full" &&
				areParticipantsEqual(left.occupant, right.occupant)
			);
		case "rejected":
			return (
				right.status === "rejected" &&
				areParticipantsEqual(left.self, right.self)
			);
		case "ended":
		case "expired":
			return true;
	}
};

const getInitialSettingsDraft = (state: VisioRoomPageState) =>
	state.status === "ended" ? null : state.room.settings;

const getFallbackDeviceLabel = (kind: DeviceKind, index: number) => {
	if (kind === "videoinput") {
		return `Caméra ${index + 1}`;
	}

	if (kind === "audioinput") {
		return `Microphone ${index + 1}`;
	}

	return `Haut-parleur ${index + 1}`;
};

const toDeviceOptions = (
	devices: MediaDeviceInfo[],
	kind: DeviceKind,
): DeviceOption[] => {
	let index = 0;

	return devices
		.filter((device) => device.kind === kind)
		.map((device) => {
			const label = device.label.trim() || getFallbackDeviceLabel(kind, index);
			index += 1;
			return {
				deviceId: device.deviceId,
				label,
				kind,
			};
		})
		.filter((device) => device.deviceId);
};

const getPreferredDeviceId = (
	currentDeviceId: string | null,
	options: DeviceOption[],
) => {
	if (
		currentDeviceId &&
		options.some((option) => option.deviceId === currentDeviceId)
	) {
		return currentDeviceId;
	}

	return options[0]?.deviceId ?? null;
};

const getTrackForKind = (
	stream: MediaStream,
	kind: "audio" | "video",
): MediaStreamTrack | null => {
	if (kind === "audio") {
		return stream.getAudioTracks()[0] ?? null;
	}

	return stream.getVideoTracks()[0] ?? null;
};

const stopStream = (stream: MediaStream | null) => {
	stream?.getTracks().forEach((track) => {
		track.stop();
	});
};

const getAudioContextConstructor = () => {
	if (typeof window === "undefined") {
		return null;
	}

	return (
		window.AudioContext ??
		(
			window as typeof window & {
				webkitAudioContext?: AudioContextConstructor;
			}
		).webkitAudioContext ??
		null
	);
};

const supportsSinkId = () => {
	if (typeof window === "undefined") {
		return false;
	}

	return (
		typeof (HTMLMediaElement.prototype as SinkIdMediaElement).setSinkId ===
		"function"
	);
};

export const useVisioRoomViewModel = (input: {
	initialState: VisioRoomPageState;
	roomSlug: string;
	iceServers: VisioIceServer[];
}) => {
	const router = useRouter();
	const [state, setState] = useState(input.initialState);
	const [joinName, setJoinName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [isCopied, setIsCopied] = useState(false);
	const [isBusy, startTransition] = useTransition();
	const [previewStatus, setPreviewStatus] = useState<MediaStatus>("idle");
	const [isMicEnabled, setIsMicEnabled] = useState(true);
	const [isCameraEnabled, setIsCameraEnabled] = useState(true);
	const [connectionState, setConnectionState] = useState("waiting");
	const [settingsDraft, setSettingsDraft] = useState<VisioRoomSettings | null>(
		input.initialState.status === "ended"
			? null
			: input.initialState.room.settings,
	);
	const [localStream, setLocalStream] = useState<MediaStream | null>(null);
	const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
	const [, setDevicesLoaded] = useState(false);
	const [audioInputOptions, setAudioInputOptions] = useState<DeviceOption[]>(
		[],
	);
	const [videoInputOptions, setVideoInputOptions] = useState<DeviceOption[]>(
		[],
	);
	const [audioOutputOptions, setAudioOutputOptions] = useState<DeviceOption[]>(
		[],
	);
	const [audioInputExposure, setAudioInputExposure] =
		useState<DeviceExposureState>("unknown");
	const [videoInputExposure, setVideoInputExposure] =
		useState<DeviceExposureState>("unknown");
	const [audioOutputExposure, setAudioOutputExposure] =
		useState<DeviceExposureState>("unknown");
	const [selectedAudioInputId, setSelectedAudioInputId] = useState<
		string | null
	>(null);
	const [selectedVideoInputId, setSelectedVideoInputId] = useState<
		string | null
	>(null);
	const [selectedAudioOutputId, setSelectedAudioOutputId] = useState<
		string | null
	>(null);
	const [micLevel, setMicLevel] = useState(0);
	const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);
	const [hasRequestedDeviceAccess, setHasRequestedDeviceAccess] =
		useState(false);

	const stateRef = useRef(state);
	const eventSourceRef = useRef<EventSource | null>(null);
	const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
	const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
	const offerInFlightRef = useRef(false);
	const localReadyRef = useRef(false);
	const remoteReadyRef = useRef(false);
	const readySignalSentRef = useRef(false);
	const lastEventIdRef = useRef(0);
	const lastPeerIdRef = useRef<string | null>(null);
	const audioMonitorRef = useRef<MediaStreamAudioMonitor | null>(null);
	const speakerTestTimeoutRef = useRef<number | null>(null);
	const remoteMediaStreamRef = useRef<MediaStream | null>(null);
	const previewVideoRef = useRef<HTMLVideoElement | null>(null);
	const localVideoRef = useRef<HTMLVideoElement | null>(null);
	const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
	const speakerTestAudioRef = useRef<HTMLAudioElement | null>(null);
	const lastInitialStateRef = useRef(input.initialState);

	const isSpeakerSelectionSupported = supportsSinkId();
	const isSpeakerTestSupported =
		isSpeakerSelectionSupported && getAudioContextConstructor() !== null;
	const peerId =
		state.status === "in_call" ? (state.peer?.participantId ?? null) : null;

	useEffect(() => {
		stateRef.current = state;
	}, [state]);

	useEffect(() => {
		if (
			areRoomPageStatesEqual(lastInitialStateRef.current, input.initialState)
		) {
			return;
		}

		lastInitialStateRef.current = input.initialState;
		setState(input.initialState);
		setSettingsDraft(getInitialSettingsDraft(input.initialState));
		setError(null);
		setNotice(null);
	}, [input.initialState]);

	useEffect(() => {
		for (const element of [previewVideoRef.current, localVideoRef.current]) {
			if (element) {
				element.srcObject = localStream;
				void ensureVideoPlayback(element);
			}
		}
	}, [localStream]);

	useEffect(() => {
		if (remoteVideoRef.current) {
			remoteVideoRef.current.srcObject = remoteStream;
			void ensureVideoPlayback(remoteVideoRef.current);
		}
	}, [remoteStream]);

	const sendSignal = useEffectEvent(async (payload: VisioSignalPayload) => {
		const response = await fetch(`/api/visio/rooms/${input.roomSlug}/signals`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			const responsePayload = (await response.json().catch(() => null)) as {
				error?: string;
			} | null;
			throw new Error(responsePayload?.error ?? "L'envoi du signal a échoué.");
		}
	});

	const stopSpeakerTest = useEffectEvent(() => {
		if (speakerTestTimeoutRef.current !== null) {
			window.clearTimeout(speakerTestTimeoutRef.current);
			speakerTestTimeoutRef.current = null;
		}

		const speakerTestAudio = speakerTestAudioRef.current;
		if (speakerTestAudio) {
			speakerTestAudio.pause();
			speakerTestAudio.srcObject = null;
		}

		setIsTestingSpeaker(false);
	});

	const stopMicMonitor = useEffectEvent(async () => {
		if (!audioMonitorRef.current) {
			setMicLevel(0);
			return;
		}

		window.cancelAnimationFrame(audioMonitorRef.current.frameId);
		audioMonitorRef.current.source.disconnect();
		await audioMonitorRef.current.audioContext.close().catch(() => undefined);
		audioMonitorRef.current = null;
		setMicLevel(0);
	});

	const resetPeerConnection = useEffectEvent((preserveLocalStream = true) => {
		offerInFlightRef.current = false;
		pendingIceCandidatesRef.current = [];
		readySignalSentRef.current = false;
		remoteReadyRef.current = false;

		if (peerConnectionRef.current) {
			peerConnectionRef.current.onicecandidate = null;
			peerConnectionRef.current.ontrack = null;
			peerConnectionRef.current.onconnectionstatechange = null;
			peerConnectionRef.current.close();
			peerConnectionRef.current = null;
		}

		setConnectionState("waiting");
		remoteMediaStreamRef.current = null;
		setRemoteStream(null);

		if (!preserveLocalStream) {
			localReadyRef.current = false;
			stopStream(localStream);
			setLocalStream(null);
			setPreviewStatus("idle");
			void stopMicMonitor();
		}
	});

	const ensurePeerConnection = useEffectEvent(() => {
		if (peerConnectionRef.current) {
			return peerConnectionRef.current;
		}

		const peerConnection = new RTCPeerConnection({
			iceServers: input.iceServers,
		});

		peerConnection.onicecandidate = (event) => {
			if (!event.candidate) {
				return;
			}

			void sendSignal({
				signalType: "ice-candidate",
				data: event.candidate.toJSON(),
			}).catch((signalError: unknown) => {
				setError(
					signalError instanceof Error
						? signalError.message
						: "Un candidat ICE n'a pas pu être envoyé.",
				);
			});
		};

		peerConnection.ontrack = (event) => {
			const nextRemoteStream =
				remoteMediaStreamRef.current ?? new MediaStream();
			const inboundTracks = event.streams[0]?.getTracks().length
				? event.streams[0].getTracks()
				: [event.track];

			for (const track of inboundTracks) {
				if (
					nextRemoteStream
						.getTracks()
						.some((existingTrack) => existingTrack.id === track.id)
				) {
					continue;
				}
				nextRemoteStream.addTrack(track);
			}

			remoteMediaStreamRef.current = nextRemoteStream;
			setRemoteStream(nextRemoteStream);
		};

		peerConnection.onconnectionstatechange = () => {
			setConnectionState(peerConnection.connectionState);
			if (peerConnection.connectionState === "failed") {
				setNotice(
					"La connexion pair à pair a échoué. Si les appareils sont sur des réseaux différents, configurez TURN dans VISIO_ICE_SERVERS_JSON.",
				);
			}
		};

		if (localStream) {
			for (const track of localStream.getTracks()) {
				if (
					peerConnection.getSenders().some((sender) => sender.track === track)
				) {
					continue;
				}
				peerConnection.addTrack(track, localStream);
			}
		}

		peerConnectionRef.current = peerConnection;
		return peerConnection;
	});

	const maybeCreateOffer = useEffectEvent(async () => {
		const currentState = stateRef.current;
		if (
			currentState.status !== "in_call" ||
			currentState.self.role !== "host" ||
			!currentState.peer ||
			!localReadyRef.current ||
			!remoteReadyRef.current ||
			offerInFlightRef.current
		) {
			return;
		}

		const peerConnection = ensurePeerConnection();
		if (
			peerConnection.signalingState !== "stable" ||
			peerConnection.connectionState === "connected"
		) {
			return;
		}

		offerInFlightRef.current = true;

		try {
			const offer = await peerConnection.createOffer();
			await peerConnection.setLocalDescription(offer);
			await sendSignal({
				signalType: "offer",
				data: {
					type: "offer",
					sdp: offer.sdp ?? "",
				},
			});
			setConnectionState("offer-sent");
		} finally {
			offerInFlightRef.current = false;
		}
	});

	const maybeAnnounceLocalReady = useEffectEvent(async () => {
		const currentState = stateRef.current;
		if (
			!localReadyRef.current ||
			currentState.status !== "in_call" ||
			!currentState.peer ||
			readySignalSentRef.current
		) {
			return;
		}

		readySignalSentRef.current = true;

		try {
			await sendSignal({ signalType: "ready", data: null });
			if (currentState.self.role === "host" && remoteReadyRef.current) {
				await maybeCreateOffer();
			}
		} catch (signalError) {
			readySignalSentRef.current = false;
			throw signalError;
		}
	});

	const flushPendingIceCandidates = useEffectEvent(async () => {
		if (!peerConnectionRef.current?.remoteDescription) {
			return;
		}

		for (const candidate of pendingIceCandidatesRef.current) {
			await peerConnectionRef.current.addIceCandidate(candidate);
		}
		pendingIceCandidatesRef.current = [];
	});

	const buildMediaConstraints = useEffectEvent(
		(selection?: {
			audioInputId?: string | null;
			videoInputId?: string | null;
		}) => {
			const nextAudioInputId = selection?.audioInputId ?? selectedAudioInputId;
			const nextVideoInputId = selection?.videoInputId ?? selectedVideoInputId;

			const audioConstraint = nextAudioInputId
				? { deviceId: { exact: nextAudioInputId } }
				: true;
			const videoConstraint = nextVideoInputId
				? { deviceId: { exact: nextVideoInputId } }
				: true;

			return {
				audio: audioConstraint,
				video: videoConstraint,
			};
		},
	);

	const refreshDevices = useEffectEvent(async () => {
		if (!navigator.mediaDevices?.enumerateDevices) {
			setDevicesLoaded(true);
			setAudioInputOptions([]);
			setVideoInputOptions([]);
			setAudioOutputOptions([]);
			setAudioInputExposure("unknown");
			setVideoInputExposure("unknown");
			setAudioOutputExposure("unknown");
			return;
		}

		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const nextAudioInputOptions = toDeviceOptions(devices, "audioinput");
			const nextVideoInputOptions = toDeviceOptions(devices, "videoinput");
			const nextAudioOutputOptions = toDeviceOptions(devices, "audiooutput");
			const hasReportedAudioInput = devices.some(
				(device) => device.kind === "audioinput",
			);
			const hasReportedVideoInput = devices.some(
				(device) => device.kind === "videoinput",
			);
			const hasReportedAudioOutput = devices.some(
				(device) => device.kind === "audiooutput",
			);

			setAudioInputOptions(nextAudioInputOptions);
			setVideoInputOptions(nextVideoInputOptions);
			setAudioOutputOptions(nextAudioOutputOptions);
			setAudioInputExposure(
				nextAudioInputOptions.length > 0
					? "available"
					: hasReportedAudioInput
						? "available"
						: "unknown",
			);
			setVideoInputExposure(
				nextVideoInputOptions.length > 0
					? "available"
					: hasReportedVideoInput
						? "available"
						: "unknown",
			);
			setAudioOutputExposure(
				nextAudioOutputOptions.length > 0
					? "available"
					: hasReportedAudioOutput
						? "available"
						: "unknown",
			);
			setSelectedAudioInputId((currentDeviceId) =>
				getPreferredDeviceId(currentDeviceId, nextAudioInputOptions),
			);
			setSelectedVideoInputId((currentDeviceId) =>
				getPreferredDeviceId(currentDeviceId, nextVideoInputOptions),
			);
			setSelectedAudioOutputId((currentDeviceId) =>
				getPreferredDeviceId(currentDeviceId, nextAudioOutputOptions),
			);
		} finally {
			setDevicesLoaded(true);
		}
	});

	const syncPeerConnectionTracks = useEffectEvent(
		async (stream: MediaStream) => {
			const currentState = stateRef.current;
			if (currentState.status !== "in_call" || !currentState.peer) {
				return;
			}

			const peerConnection = ensurePeerConnection();
			const tracksByKind = {
				audio: getTrackForKind(stream, "audio"),
				video: getTrackForKind(stream, "video"),
			};

			for (const kind of ["audio", "video"] as const) {
				const track = tracksByKind[kind];
				const sender = peerConnection
					.getSenders()
					.find((candidate) => candidate.track?.kind === kind);

				if (sender) {
					await sender.replaceTrack(track);
					continue;
				}

				if (track) {
					peerConnection.addTrack(track, stream);
				}
			}
		},
	);

	const applyLocalTrackPreferences = useEffectEvent((stream: MediaStream) => {
		for (const track of stream.getAudioTracks()) {
			track.enabled = isMicEnabled;
		}

		for (const track of stream.getVideoTracks()) {
			track.enabled = isCameraEnabled;
		}
	});

	const startMicMonitor = useEffectEvent(async (stream: MediaStream | null) => {
		await stopMicMonitor();

		const audioTrack = stream?.getAudioTracks()[0];
		const AudioContextCtor = getAudioContextConstructor();
		if (!audioTrack || !AudioContextCtor) {
			return;
		}

		try {
			const audioContext = new AudioContextCtor();
			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 256;
			const source = audioContext.createMediaStreamSource(
				new MediaStream([audioTrack]),
			);
			source.connect(analyser);

			const data = new Uint8Array(analyser.fftSize);
			const monitor = () => {
				analyser.getByteTimeDomainData(data);
				let total = 0;
				for (const value of data) {
					const centeredValue = (value - 128) / 128;
					total += centeredValue * centeredValue;
				}

				const volume = Math.sqrt(total / data.length);
				setMicLevel(Math.min(1, volume * 4));
				if (audioMonitorRef.current) {
					audioMonitorRef.current.frameId =
						window.requestAnimationFrame(monitor);
				}
			};

			audioMonitorRef.current = {
				audioContext,
				analyser,
				source,
				frameId: window.requestAnimationFrame(monitor),
			};
		} catch {
			setMicLevel(0);
		}
	});

	const applySinkIdToElement = useEffectEvent(
		async (element: HTMLMediaElement | null, sinkId: string | null) => {
			if (!element || !sinkId || !isSpeakerSelectionSupported) {
				return;
			}

			const sinkElement = element as SinkIdMediaElement;
			if (!sinkElement.setSinkId) {
				return;
			}

			await sinkElement.setSinkId(sinkId);
		},
	);

	const startPreview = useEffectEvent(
		async (selection?: {
			audioInputId?: string | null;
			videoInputId?: string | null;
		}) => {
			setError(null);
			setNotice(null);
			setHasRequestedDeviceAccess(true);

			if (!navigator.mediaDevices?.getUserMedia) {
				setPreviewStatus("unsupported");
				setError(
					"L'accès à la caméra et au microphone n'est pas disponible ici.",
				);
				return;
			}

			const constraints = buildMediaConstraints(selection);
			if (!constraints.audio && !constraints.video) {
				setPreviewStatus("unsupported");
				setError(
					"Aucune caméra ni aucun microphone n'est disponible sur cet appareil.",
				);
				return;
			}

			const previousStream = localStream;

			try {
				setPreviewStatus("requesting");
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				applyLocalTrackPreferences(stream);
				setLocalStream(stream);
				setPreviewStatus("ready");
				localReadyRef.current = true;
				setAudioInputExposure(
					stream.getAudioTracks().length > 0 ? "available" : "unavailable",
				);
				setVideoInputExposure(
					stream.getVideoTracks().length > 0 ? "available" : "unavailable",
				);
				await refreshDevices();
				await syncPeerConnectionTracks(stream);
				stopStream(previousStream);
				await maybeAnnounceLocalReady();
			} catch (mediaError) {
				setPreviewStatus("idle");
				localReadyRef.current = false;
				setError(
					mediaError instanceof Error
						? mediaError.message
						: "L'accès à la caméra et au microphone a été refusé.",
				);
			}
		},
	);

	const handleSignalEvent = useEffectEvent(
		async (event: Extract<VisioRoomEvent, { type: "signal" }>) => {
			const currentState = stateRef.current;
			if (currentState.status !== "in_call") {
				return;
			}

			if (event.participant.participantId === currentState.self.participantId) {
				return;
			}

			if (event.signalType === "ready") {
				remoteReadyRef.current = true;
				if (currentState.self.role === "host" && localReadyRef.current) {
					await maybeCreateOffer();
				}
				return;
			}

			if (event.signalType === "hangup") {
				resetPeerConnection(true);
				return;
			}

			if (!localReadyRef.current) {
				return;
			}

			const peerConnection = ensurePeerConnection();

			if (event.signalType === "offer" && currentState.self.role === "guest") {
				await peerConnection.setRemoteDescription(event.data);
				await flushPendingIceCandidates();
				const answer = await peerConnection.createAnswer();
				await peerConnection.setLocalDescription(answer);
				await sendSignal({
					signalType: "answer",
					data: {
						type: "answer",
						sdp: answer.sdp ?? "",
					},
				});
				setConnectionState("answer-sent");
				return;
			}

			if (event.signalType === "answer" && currentState.self.role === "host") {
				await peerConnection.setRemoteDescription(event.data);
				await flushPendingIceCandidates();
				setConnectionState("connected");
				return;
			}

			if (event.signalType === "ice-candidate") {
				if (!peerConnection.remoteDescription) {
					pendingIceCandidatesRef.current.push(event.data);
					return;
				}

				await peerConnection.addIceCandidate(event.data);
			}
		},
	);

	useEffect(() => {
		void refreshDevices();

		if (!navigator.mediaDevices) {
			return;
		}

		const handleDeviceChange = () => {
			void refreshDevices();
		};

		navigator.mediaDevices.addEventListener?.(
			"devicechange",
			handleDeviceChange,
		);

		return () => {
			navigator.mediaDevices.removeEventListener?.(
				"devicechange",
				handleDeviceChange,
			);
		};
	}, []);

	useEffect(() => {
		void startMicMonitor(localStream);

		return () => {
			void stopMicMonitor();
		};
	}, [localStream]);

	useEffect(() => {
		if (lastPeerIdRef.current !== peerId) {
			lastPeerIdRef.current = peerId;
			readySignalSentRef.current = false;
			remoteReadyRef.current = false;
		}

		if (peerId && localReadyRef.current) {
			void maybeAnnounceLocalReady().catch((signalError: unknown) => {
				setError(
					signalError instanceof Error
						? signalError.message
						: "Le média local n'a pas pu être annoncé.",
				);
			});
		}
	}, [peerId]);

	useEffect(() => {
		if (!selectedAudioOutputId || !isSpeakerSelectionSupported) {
			return;
		}

		void (async () => {
			try {
				await applySinkIdToElement(
					remoteVideoRef.current,
					selectedAudioOutputId,
				);
				await applySinkIdToElement(
					speakerTestAudioRef.current,
					selectedAudioOutputId,
				);
			} catch {
				setNotice(
					"La sélection de sortie audio n'est pas prise en charge dans ce navigateur.",
				);
			}
		})();
	}, [isSpeakerSelectionSupported, selectedAudioOutputId]);

	useEffect(() => {
		if (!(state.status === "pending" || state.status === "in_call")) {
			eventSourceRef.current?.close();
			eventSourceRef.current = null;
			return;
		}

		const source = new EventSource(
			`/api/visio/rooms/${input.roomSlug}/events?lastEventId=${lastEventIdRef.current}`,
		);
		eventSourceRef.current = source;

		source.addEventListener("visio", (message) => {
			const event = JSON.parse(
				(message as MessageEvent).data,
			) as VisioRoomEvent;
			lastEventIdRef.current = event.id;

			if (event.type === "room-ended") {
				resetPeerConnection(false);
			}

			if (
				event.type === "participant-left" &&
				stateRef.current.status === "in_call" &&
				stateRef.current.peer?.participantId === event.participant.participantId
			) {
				resetPeerConnection(true);
			}

			if (event.type === "signal") {
				void handleSignalEvent(event).catch((signalError: unknown) => {
					setError(
						signalError instanceof Error
							? signalError.message
							: "Le signal entrant n'a pas pu être traité.",
					);
				});
			}

			setState((currentState) => applyVisioRoomPageEvent(currentState, event));
		});

		source.addEventListener("visio-error", (message) => {
			const payload = JSON.parse((message as MessageEvent).data) as {
				error?: string;
			};
			setError(
				payload.error ??
					"Le flux d'événements du salon s'est fermé de façon inattendue.",
			);
		});

		source.onerror = () => {
			setNotice("Le salon se reconnecte aux événements en direct.");
		};

		return () => {
			source.close();
			if (eventSourceRef.current === source) {
				eventSourceRef.current = null;
			}
		};
	}, [input.roomSlug, state.status]);

	useEffect(() => {
		return () => {
			eventSourceRef.current?.close();
			stopSpeakerTest();
			void stopMicMonitor();
			resetPeerConnection(false);
		};
	}, []);

	const handleCopyLink = async () => {
		if (state.status === "ended") {
			return;
		}

		try {
			const shareUrl = new URL(
				state.room.sharePath,
				window.location.origin,
			).toString();
			await navigator.clipboard.writeText(shareUrl);
			setIsCopied(true);
		} catch {
			setError(
				"La copie a échoué. Vous pouvez toujours copier le lien du salon manuellement.",
			);
		}
	};

	const handleSignIn = () => {
		setError(null);
		void authClient.signIn.social({
			provider: "github",
			callbackURL: `/visio/${input.roomSlug}`,
		});
	};

	const handleJoinSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		startTransition(() => {
			void (async () => {
				const response = await fetch(
					`/api/visio/rooms/${input.roomSlug}/join`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ displayName: joinName }),
					},
				);

				if (!response.ok) {
					const payload = (await response.json().catch(() => null)) as {
						error?: string;
					} | null;
					setError(payload?.error ?? "Le salon n'a pas pu être rejoint.");
					return;
				}

				router.refresh();
			})();
		});
	};

	const handleStartPreview = async () => {
		await startPreview();
	};

	const handleStopPreview = async () => {
		setError(null);
		setNotice(null);
		stopSpeakerTest();
		localReadyRef.current = false;
		readySignalSentRef.current = false;
		stopStream(localStream);
		setLocalStream(null);
		setPreviewStatus("idle");
		await stopMicMonitor();
	};

	const handleRefreshDevices = async () => {
		await refreshDevices();
	};

	const handleSelectAudioInput = async (deviceId: string) => {
		setSelectedAudioInputId(deviceId);
		if (localReadyRef.current) {
			await startPreview({ audioInputId: deviceId });
		}
	};

	const handleSelectVideoInput = async (deviceId: string) => {
		setSelectedVideoInputId(deviceId);
		if (localReadyRef.current) {
			await startPreview({ videoInputId: deviceId });
		}
	};

	const handleSelectAudioOutput = async (deviceId: string) => {
		setSelectedAudioOutputId(deviceId);
	};

	const handleTestSpeaker = async () => {
		if (!isSpeakerTestSupported) {
			setNotice(
				"La sélection de sortie audio n'est pas prise en charge dans ce navigateur.",
			);
			return;
		}

		const speakerTestAudio = speakerTestAudioRef.current;
		const AudioContextCtor = getAudioContextConstructor();
		if (!speakerTestAudio || !AudioContextCtor) {
			setNotice(
				"La sélection de sortie audio n'est pas prise en charge dans ce navigateur.",
			);
			return;
		}

		stopSpeakerTest();
		setError(null);
		setNotice(null);
		setIsTestingSpeaker(true);

		try {
			await applySinkIdToElement(speakerTestAudio, selectedAudioOutputId);
			const audioContext = new AudioContextCtor();
			const oscillator = audioContext.createOscillator();
			const gain = audioContext.createGain();
			const destination = audioContext.createMediaStreamDestination();

			oscillator.type = "sine";
			oscillator.frequency.value = 660;
			gain.gain.value = 0.0001;

			oscillator.connect(gain);
			gain.connect(destination);

			speakerTestAudio.srcObject = destination.stream;
			await speakerTestAudio.play();

			const now = audioContext.currentTime;
			gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
			gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
			oscillator.start(now);
			oscillator.stop(now + 0.42);

			speakerTestTimeoutRef.current = window.setTimeout(() => {
				void audioContext.close().catch(() => undefined);
				stopSpeakerTest();
			}, 520);
		} catch (speakerError) {
			stopSpeakerTest();
			setError(
				speakerError instanceof Error
					? speakerError.message
					: "Le test du haut-parleur n'a pas pu être lu.",
			);
		}
	};

	const handleToggleTrack = (kind: "audio" | "video") => {
		if (!localStream) {
			if (kind === "audio") {
				setIsMicEnabled((currentValue) => !currentValue);
			} else {
				setIsCameraEnabled((currentValue) => !currentValue);
			}
			return;
		}

		for (const track of localStream.getTracks()) {
			if (track.kind !== kind) {
				continue;
			}
			track.enabled = !track.enabled;
			if (kind === "audio") {
				setIsMicEnabled(track.enabled);
			} else {
				setIsCameraEnabled(track.enabled);
			}
		}
	};

	const handleLeave = () => {
		setError(null);
		startTransition(() => {
			void (async () => {
				const response = await fetch(
					`/api/visio/rooms/${input.roomSlug}/leave`,
					{
						method: "POST",
					},
				);

				if (!response.ok) {
					const payload = (await response.json().catch(() => null)) as {
						error?: string;
					} | null;
					setError(payload?.error ?? "Le salon n'a pas pu être quitté.");
					return;
				}

				eventSourceRef.current?.close();
				resetPeerConnection(false);
				router.refresh();
			})();
		});
	};

	const handleAdmissionDecision = (
		participantId: string,
		decision: "approve" | "reject",
	) => {
		setError(null);
		startTransition(() => {
			void (async () => {
				const response = await fetch(
					`/api/visio/rooms/${input.roomSlug}/participants/${participantId}/admission`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ decision }),
					},
				);

				if (!response.ok) {
					const payload = (await response.json().catch(() => null)) as {
						error?: string;
					} | null;
					setError(
						payload?.error ?? "L'examen de l'invité n'a pas pu être terminé.",
					);
					return;
				}

				const payload = (await response.json().catch(() => null)) as {
					participant?: VisioParticipantSummary;
				} | null;

				if (decision === "approve" && payload?.participant) {
					const approvedParticipant = payload.participant;
					setState((currentState) =>
						currentState.status !== "in_call"
							? currentState
							: ({
									...currentState,
									room: {
										...currentState.room,
										settingsLocked: true,
									},
									peer: approvedParticipant,
									pendingGuest: null,
								} satisfies VisioRoomPageState),
					);
				}

				if (decision === "reject") {
					setState((currentState) =>
						currentState.status !== "in_call"
							? currentState
							: ({
									...currentState,
									pendingGuest: null,
								} satisfies VisioRoomPageState),
					);
				}
			})();
		});
	};

	const handleSettingsSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!settingsDraft) {
			return;
		}

		setError(null);
		startTransition(() => {
			void (async () => {
				const response = await fetch(`/api/visio/rooms/${input.roomSlug}`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(settingsDraft),
				});

				if (!response.ok) {
					const payload = (await response.json().catch(() => null)) as {
						error?: string;
					} | null;
					setError(
						payload?.error ??
							"Les réglages du salon n'ont pas pu être enregistrés.",
					);
					return;
				}

				const payload = (await response.json().catch(() => null)) as {
					settings?: VisioRoomSettings;
					settingsLocked?: boolean;
				} | null;

				if (!payload?.settings) {
					return;
				}

				const nextSettings = payload.settings;
				const nextSettingsLocked = payload.settingsLocked ?? false;

				setState((currentState) =>
					currentState.status === "ended"
						? currentState
						: ({
								...currentState,
								room: {
									...currentState.room,
									settings: nextSettings,
									settingsLocked: nextSettingsLocked,
								},
							} satisfies VisioRoomPageState),
				);
			})();
		});
	};

	const hasLocalAudioTrack = !!localStream?.getAudioTracks().length;
	const hasLocalVideoTrack = !!localStream?.getVideoTracks().length;
	const effectiveAudioInputExposure = hasLocalAudioTrack
		? "available"
		: audioInputExposure;
	const effectiveVideoInputExposure = hasLocalVideoTrack
		? "available"
		: videoInputExposure;
	const effectiveAudioOutputExposure =
		audioOutputOptions.length > 0 ? "available" : audioOutputExposure;

	return {
		state,
		error,
		notice,
		joinName,
		setJoinName,
		isBusy,
		isCopied,
		handleCopyLink,
		handleJoinSubmit,
		handleSignIn,
		handleStartPreview,
		handleStopPreview,
		handleRefreshDevices,
		handleSelectAudioInput,
		handleSelectVideoInput,
		handleSelectAudioOutput,
		handleTestSpeaker,
		handleToggleTrack,
		handleLeave,
		handleAdmissionDecision,
		settingsDraft,
		setSettingsDraft,
		handleSettingsSubmit,
		previewVideoRef,
		localVideoRef,
		remoteVideoRef,
		speakerTestAudioRef,
		previewStatus,
		isMicEnabled,
		isCameraEnabled,
		connectionState,
		hasLocalMedia: !!localStream?.getTracks().length,
		hasRemoteMedia: !!remoteStream?.getTracks().length,
		hasLocalAudioTrack,
		hasLocalVideoTrack,
		audioInputOptions,
		videoInputOptions,
		audioOutputOptions,
		audioInputExposure: effectiveAudioInputExposure,
		videoInputExposure: effectiveVideoInputExposure,
		audioOutputExposure: effectiveAudioOutputExposure,
		selectedAudioInputId,
		selectedVideoInputId,
		selectedAudioOutputId,
		hasRequestedDeviceAccess,
		isSpeakerSelectionSupported,
		isSpeakerTestSupported,
		isTestingSpeaker,
		micLevel,
	};
};
