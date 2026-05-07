"use client";

import type { RefObject } from "react";

type DeviceOption = {
	deviceId: string;
	label: string;
};

type MediaStatus = "idle" | "requesting" | "ready" | "unsupported";
type DeviceExposureState = "unknown" | "available" | "unavailable";

const formatMicLevel = (value: number) => `${Math.round(value * 100)}%`;

export function VisioDevicePanel(props: {
	previewVideoRef: RefObject<HTMLVideoElement | null>;
	speakerTestAudioRef: RefObject<HTMLAudioElement | null>;
	previewStatus: MediaStatus;
	hasLocalMedia: boolean;
	hasLocalVideoTrack: boolean;
	audioInputOptions: DeviceOption[];
	videoInputOptions: DeviceOption[];
	audioOutputOptions: DeviceOption[];
	audioInputExposure: DeviceExposureState;
	videoInputExposure: DeviceExposureState;
	audioOutputExposure: DeviceExposureState;
	selectedAudioInputId: string | null;
	selectedVideoInputId: string | null;
	selectedAudioOutputId: string | null;
	hasRequestedDeviceAccess: boolean;
	isSpeakerSelectionSupported: boolean;
	isSpeakerTestSupported: boolean;
	isTestingSpeaker: boolean;
	isMicEnabled: boolean;
	isCameraEnabled: boolean;
	micLevel: number;
	onStartPreview: () => void;
	onStopPreview: () => void;
	onRefreshDevices: () => void;
	onSelectAudioInput: (deviceId: string) => void;
	onSelectVideoInput: (deviceId: string) => void;
	onSelectAudioOutput: (deviceId: string) => void;
	onTestSpeaker: () => void;
}) {
	const previewButtonLabel =
		props.previewStatus === "requesting"
			? "Requesting access..."
			: props.hasLocalMedia
				? "Restart preview"
				: "Start preview";

	const previewStatusText =
		props.previewStatus === "requesting"
			? "Browser permissions are being requested."
			: props.previewStatus === "unsupported"
				? "Camera and microphone access are not available in this browser."
				: props.hasLocalMedia
					? "Preview live. Your device choices will carry into the call."
					: "Preview stays off until you ask for it.";

	const getMissingDeviceMessage = (kind: "camera" | "microphone" | "speaker") => {
		if (kind === "speaker" && !props.isSpeakerSelectionSupported) {
			return "Speaker output switching is not supported by this mobile browser.";
		}

		if (!props.hasRequestedDeviceAccess) {
			return `Tap Start preview first so the browser can expose your ${kind} list.`;
		}

		return `This browser still is not exposing a ${kind} list right now. Preview can still use the default device if permission is granted.`;
	};

	return (
		<section className="rounded-[1.75rem] border border-stone-900/10 bg-white p-6 shadow-[0_18px_48px_rgba(41,37,36,0.08)]">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p className="font-semibold text-emerald-700 text-sm uppercase tracking-[0.3em]">
						Device check
					</p>
					<h2 className="mt-3 font-black text-3xl text-stone-950 tracking-tight">
						Test your setup before the call.
					</h2>
					<p className="mt-3 max-w-2xl text-sm text-stone-600 leading-6">
						Choose the camera, microphone, and speaker you want to use, then run
						a quick local check.
					</p>
				</div>
				<div className="flex flex-wrap gap-3">
					<button
						className="rounded-full bg-stone-950 px-5 py-3 font-semibold text-sm text-stone-50 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-400"
						disabled={props.previewStatus === "requesting"}
						onClick={props.onStartPreview}
						type="button"
					>
						{previewButtonLabel}
					</button>
					<button
						className="rounded-full border border-stone-300 px-5 py-3 font-semibold text-sm text-stone-900 transition hover:border-stone-500 disabled:cursor-not-allowed disabled:opacity-60"
						disabled={props.previewStatus === "requesting" || !props.hasLocalMedia}
						onClick={props.onStopPreview}
						type="button"
					>
						Stop preview
					</button>
					<button
						className="rounded-full border border-stone-300 px-5 py-3 font-semibold text-sm text-stone-900 transition hover:border-stone-500 disabled:cursor-not-allowed disabled:opacity-60"
						disabled={props.previewStatus === "requesting"}
						onClick={props.onRefreshDevices}
						type="button"
					>
						Refresh devices
					</button>
				</div>
			</div>

			<div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
				<section className="overflow-hidden rounded-[1.5rem] border border-stone-900/10 bg-stone-950">
					<div className="relative aspect-video">
						<video
							autoPlay
							className="size-full object-cover"
							muted
							playsInline
							ref={props.previewVideoRef}
						/>
						{!props.hasLocalVideoTrack || !props.isCameraEnabled ? (
							<div className="absolute inset-0 flex items-center justify-center bg-stone-950/70 px-6 text-center text-sm text-stone-200">
								{props.hasLocalMedia
									? "Camera preview is off."
									: "Preview will appear here when you start the local device check."}
							</div>
						) : null}
					</div>
					<div className="space-y-3 p-5">
						<p className="font-semibold text-emerald-300 text-sm uppercase tracking-[0.3em]">
							Local preview
						</p>
						<p className="text-sm text-stone-200 leading-6">{previewStatusText}</p>
					</div>
				</section>

				<section className="space-y-5">
					<label className="block">
						<span className="mb-2 block font-medium text-sm text-stone-700">
							Camera
						</span>
						<select
							className="block w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={!props.videoInputOptions.length || props.previewStatus === "requesting"}
							onChange={(event) => {
								props.onSelectVideoInput(event.target.value);
							}}
							value={props.selectedVideoInputId ?? ""}
						>
							{props.videoInputOptions.length ? null : (
								<option value="">
									{props.videoInputExposure === "unavailable"
										? "No camera available"
										: "Camera list will appear after access"}
								</option>
							)}
							{props.videoInputOptions.map((device) => (
								<option key={device.deviceId} value={device.deviceId}>
									{device.label}
								</option>
							))}
						</select>
						{!props.videoInputOptions.length ? (
							<p className="mt-2 text-sm text-stone-500 leading-6">
								{getMissingDeviceMessage("camera")}
							</p>
						) : null}
					</label>

					<label className="block">
						<span className="mb-2 block font-medium text-sm text-stone-700">
							Microphone
						</span>
						<select
							className="block w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={!props.audioInputOptions.length || props.previewStatus === "requesting"}
							onChange={(event) => {
								props.onSelectAudioInput(event.target.value);
							}}
							value={props.selectedAudioInputId ?? ""}
						>
							{props.audioInputOptions.length ? null : (
								<option value="">
									{props.audioInputExposure === "unavailable"
										? "No microphone available"
										: "Microphone list will appear after access"}
								</option>
							)}
							{props.audioInputOptions.map((device) => (
								<option key={device.deviceId} value={device.deviceId}>
									{device.label}
								</option>
							))}
						</select>
						{!props.audioInputOptions.length ? (
							<p className="mt-2 text-sm text-stone-500 leading-6">
								{getMissingDeviceMessage("microphone")}
							</p>
						) : null}
					</label>

					<div className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-4">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="font-semibold text-sm text-stone-950">
									Microphone activity
								</p>
								<p className="mt-1 text-sm text-stone-600">
									{props.hasLocalMedia && props.isMicEnabled
										? "Speak to confirm that your mic reacts."
										: "Start preview and unmute your microphone to test it."}
								</p>
							</div>
							<span className="font-semibold text-emerald-700 text-sm">
								{formatMicLevel(props.micLevel)}
							</span>
						</div>
						<div
							aria-label="Microphone activity"
							className="mt-4 h-3 overflow-hidden rounded-full bg-stone-200"
							role="meter"
						>
							<div
								className="h-full rounded-full bg-emerald-500 transition-[width]"
								style={{ width: formatMicLevel(props.micLevel) }}
							/>
						</div>
					</div>

					<label className="block">
						<span className="mb-2 block font-medium text-sm text-stone-700">
							Speaker
						</span>
						<select
							className="block w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={
								!props.audioOutputOptions.length ||
								!props.isSpeakerSelectionSupported ||
								props.previewStatus === "requesting"
							}
							onChange={(event) => {
								props.onSelectAudioOutput(event.target.value);
							}}
							value={props.selectedAudioOutputId ?? ""}
						>
							{props.audioOutputOptions.length ? null : (
								<option value="">
									{props.audioOutputExposure === "unavailable"
										? "No speaker output available"
										: "Speaker list is browser-dependent"}
								</option>
							)}
							{props.audioOutputOptions.map((device) => (
								<option key={device.deviceId} value={device.deviceId}>
									{device.label}
								</option>
							))}
						</select>
						{!props.audioOutputOptions.length ? (
							<p className="mt-2 text-sm text-stone-500 leading-6">
								{getMissingDeviceMessage("speaker")}
							</p>
						) : null}
					</label>

					<div className="flex flex-wrap items-center gap-3">
						<button
							className="rounded-full border border-stone-300 px-5 py-3 font-semibold text-sm text-stone-900 transition hover:border-stone-500 disabled:cursor-not-allowed disabled:opacity-60"
							disabled={!props.isSpeakerTestSupported || props.isTestingSpeaker}
							onClick={props.onTestSpeaker}
							type="button"
						>
							{props.isTestingSpeaker ? "Playing test..." : "Test speaker"}
						</button>
						{!props.isSpeakerSelectionSupported ? (
							<p className="text-sm text-amber-700 leading-6">
								Speaker output selection is not supported in this browser.
							</p>
						) : null}
					</div>
				</section>
			</div>

			<audio hidden ref={props.speakerTestAudioRef} />
		</section>
	);
}
