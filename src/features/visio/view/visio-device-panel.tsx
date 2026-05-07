"use client";

import type { RefObject } from "react";

import { Button, Field, Panel, SectionHeader, Select } from "@/shared/ui";

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
			? "Demande d'accès..."
			: props.hasLocalMedia
				? "Relancer l'aperçu"
				: "Démarrer l'aperçu";

	const previewStatusText =
		props.previewStatus === "requesting"
			? "Les autorisations du navigateur sont en cours de demande."
			: props.previewStatus === "unsupported"
				? "L'accès à la caméra et au microphone n'est pas disponible dans ce navigateur."
				: props.hasLocalMedia
					? "Aperçu actif. Vos choix de périphériques seront conservés pour l'appel."
					: "L'aperçu reste désactivé tant que vous ne le demandez pas.";

	const getMissingDeviceMessage = (
		kind: "camera" | "microphone" | "speaker",
	) => {
		if (kind === "speaker" && !props.isSpeakerSelectionSupported) {
			return "Le changement de sortie audio n'est pas pris en charge par ce navigateur mobile.";
		}

		if (!props.hasRequestedDeviceAccess) {
			const label =
				kind === "camera"
					? "caméras"
					: kind === "microphone"
						? "microphones"
						: "haut-parleurs";
			return `Démarrez d'abord l'aperçu pour que le navigateur puisse afficher la liste des ${label}.`;
		}

		return "Ce navigateur n'expose pas encore cette liste de périphériques. L'aperçu peut tout de même utiliser le périphérique par défaut si l'autorisation est accordée.";
	};

	return (
		<Panel>
			<div className="flex flex-wrap items-start justify-between gap-4">
				<SectionHeader
					description={
						<>
							Choisissez la caméra, le microphone et le haut-parleur à utiliser,
							puis lancez une vérification locale rapide.
						</>
					}
					eyebrow="Vérification des périphériques"
					title="Tester votre configuration avant l'appel."
				/>
				<div className="flex flex-wrap gap-3">
					<Button
						disabled={props.previewStatus === "requesting"}
						onClick={props.onStartPreview}
						type="button"
					>
						{previewButtonLabel}
					</Button>
					<Button
						disabled={
							props.previewStatus === "requesting" || !props.hasLocalMedia
						}
						onClick={props.onStopPreview}
						type="button"
						variant="secondary"
					>
						Arrêter l'aperçu
					</Button>
					<Button
						disabled={props.previewStatus === "requesting"}
						onClick={props.onRefreshDevices}
						type="button"
						variant="secondary"
					>
						Actualiser les périphériques
					</Button>
				</div>
			</div>

			<div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
				<section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
					<div className="relative aspect-video">
						<video
							autoPlay
							className="size-full object-cover"
							muted
							playsInline
							ref={props.previewVideoRef}
						/>
						{!props.hasLocalVideoTrack || !props.isCameraEnabled ? (
							<div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-6 text-center text-slate-200 text-sm">
								{props.hasLocalMedia
									? "L'aperçu caméra est désactivé."
									: "L'aperçu apparaîtra ici au démarrage de la vérification locale."}
							</div>
						) : null}
					</div>
					<div className="space-y-3 p-5">
						<p className="font-semibold text-slate-300 text-sm">Aperçu local</p>
						<p className="text-slate-200 text-sm leading-6">
							{previewStatusText}
						</p>
					</div>
				</section>

				<section className="space-y-5">
					<Field
						help={
							!props.videoInputOptions.length
								? getMissingDeviceMessage("camera")
								: null
						}
						htmlFor="visio-video-input"
						label="Caméra"
					>
						<Select
							disabled={
								!props.videoInputOptions.length ||
								props.previewStatus === "requesting"
							}
							id="visio-video-input"
							onChange={(event) => {
								props.onSelectVideoInput(event.target.value);
							}}
							value={props.selectedVideoInputId ?? ""}
						>
							{props.videoInputOptions.length ? null : (
								<option value="">
									{props.videoInputExposure === "unavailable"
										? "Aucune caméra disponible"
										: "La liste des caméras apparaîtra après l'accès"}
								</option>
							)}
							{props.videoInputOptions.map((device) => (
								<option key={device.deviceId} value={device.deviceId}>
									{device.label}
								</option>
							))}
						</Select>
					</Field>

					<Field
						help={
							!props.audioInputOptions.length
								? getMissingDeviceMessage("microphone")
								: null
						}
						htmlFor="visio-audio-input"
						label="Microphone"
					>
						<Select
							disabled={
								!props.audioInputOptions.length ||
								props.previewStatus === "requesting"
							}
							id="visio-audio-input"
							onChange={(event) => {
								props.onSelectAudioInput(event.target.value);
							}}
							value={props.selectedAudioInputId ?? ""}
						>
							{props.audioInputOptions.length ? null : (
								<option value="">
									{props.audioInputExposure === "unavailable"
										? "Aucun microphone disponible"
										: "La liste des microphones apparaîtra après l'accès"}
								</option>
							)}
							{props.audioInputOptions.map((device) => (
								<option key={device.deviceId} value={device.deviceId}>
									{device.label}
								</option>
							))}
						</Select>
					</Field>

					<div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="font-semibold text-slate-950 text-sm">
									Activité du microphone
								</p>
								<p className="mt-1 text-slate-600 text-sm">
									{props.hasLocalMedia && props.isMicEnabled
										? "Parlez pour confirmer que votre micro réagit."
										: "Démarrez l'aperçu et activez votre microphone pour le tester."}
								</p>
							</div>
							<span className="font-semibold text-sky-700 text-sm">
								{formatMicLevel(props.micLevel)}
							</span>
						</div>
						<meter
							aria-label="Activité du microphone"
							className="sr-only"
							max={1}
							min={0}
							value={props.micLevel}
						/>
						<div
							aria-hidden="true"
							className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200"
						>
							<div
								className="h-full rounded-full bg-sky-500 transition-[width]"
								style={{ width: formatMicLevel(props.micLevel) }}
							/>
						</div>
					</div>

					<Field
						help={
							!props.audioOutputOptions.length
								? getMissingDeviceMessage("speaker")
								: null
						}
						htmlFor="visio-audio-output"
						label="Haut-parleur"
					>
						<Select
							disabled={
								!props.audioOutputOptions.length ||
								!props.isSpeakerSelectionSupported ||
								props.previewStatus === "requesting"
							}
							id="visio-audio-output"
							onChange={(event) => {
								props.onSelectAudioOutput(event.target.value);
							}}
							value={props.selectedAudioOutputId ?? ""}
						>
							{props.audioOutputOptions.length ? null : (
								<option value="">
									{props.audioOutputExposure === "unavailable"
										? "Aucune sortie haut-parleur disponible"
										: "La liste des haut-parleurs dépend du navigateur"}
								</option>
							)}
							{props.audioOutputOptions.map((device) => (
								<option key={device.deviceId} value={device.deviceId}>
									{device.label}
								</option>
							))}
						</Select>
					</Field>

					<div className="flex flex-wrap items-center gap-3">
						<Button
							disabled={!props.isSpeakerTestSupported || props.isTestingSpeaker}
							onClick={props.onTestSpeaker}
							type="button"
							variant="secondary"
						>
							{props.isTestingSpeaker
								? "Test en cours..."
								: "Tester le haut-parleur"}
						</Button>
						{!props.isSpeakerSelectionSupported ? (
							<p className="text-amber-700 text-sm leading-6">
								La sélection de sortie audio n'est pas prise en charge dans ce
								navigateur.
							</p>
						) : null}
					</div>
				</section>
			</div>

			<audio hidden ref={props.speakerTestAudioRef}>
				<track kind="captions" />
			</audio>
		</Panel>
	);
}
