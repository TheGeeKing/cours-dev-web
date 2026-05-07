"use client";

import type { RefObject } from "react";

import type {
	VisioIceServer,
	VisioRoomPageState,
} from "@/features/visio/model/visio.types";
import { VisioDevicePanel } from "@/features/visio/view/visio-device-panel";
import { useVisioRoomViewModel } from "@/features/visio/view-model/use-visio-room-view-model";
import {
	Alert,
	Badge,
	Button,
	CheckboxRow,
	Field,
	FormPanel,
	Input,
	PageContainer,
	PageShell,
	Panel,
	SectionHeader,
} from "@/shared/ui";

const formatDate = (value: string) =>
	new Intl.DateTimeFormat("fr-FR", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));

function StatusPill(props: { label: string }) {
	return <Badge>{props.label}</Badge>;
}

function VideoPanel(props: {
	label: string;
	name: string;
	status: string;
	videoRef: RefObject<HTMLVideoElement | null>;
}) {
	return (
		<Panel className="overflow-hidden p-0">
			<div className="aspect-video bg-slate-950">
				<video
					autoPlay
					className="size-full object-cover"
					muted={props.label !== "Distant"}
					playsInline
					ref={props.videoRef}
				/>
			</div>
			<div className="space-y-2 p-5">
				<p className="font-semibold text-slate-500 text-sm">{props.label}</p>
				<h3 className="font-semibold text-slate-950 text-xl">{props.name}</h3>
				<p className="text-slate-600 text-sm leading-6">{props.status}</p>
			</div>
		</Panel>
	);
}

export function VisioRoomShell(props: {
	initialState: VisioRoomPageState;
	iceServers: VisioIceServer[];
	roomSlug: string;
}) {
	const viewModel = useVisioRoomViewModel(props);

	if (viewModel.state.status === "ended") {
		return (
			<PageShell>
				<PageContainer size="narrow">
					<Panel>
						<SectionHeader
							description="Le lien du salon est peut-être invalide, ou l'hôte a peut-être déjà terminé l'appel."
							eyebrow="Indisponible"
							title="Ce salon visio n'est plus disponible."
							titleAs="h1"
						/>
					</Panel>
				</PageContainer>
			</PageShell>
		);
	}

	const room = viewModel.state.room;
	const joinableState =
		viewModel.state.status === "joinable" ? viewModel.state : null;
	const pendingState =
		viewModel.state.status === "pending" ? viewModel.state : null;
	const inCallState =
		viewModel.state.status === "in_call" ? viewModel.state : null;
	const fullState = viewModel.state.status === "full" ? viewModel.state : null;
	const rejectedState =
		viewModel.state.status === "rejected" ? viewModel.state : null;
	const expiredState =
		viewModel.state.status === "expired" ? viewModel.state : null;
	const settingsDraft = viewModel.settingsDraft;

	const devicePanel = (
		<VisioDevicePanel
			audioInputExposure={viewModel.audioInputExposure}
			audioInputOptions={viewModel.audioInputOptions}
			audioOutputExposure={viewModel.audioOutputExposure}
			audioOutputOptions={viewModel.audioOutputOptions}
			hasLocalMedia={viewModel.hasLocalMedia}
			hasLocalVideoTrack={viewModel.hasLocalVideoTrack}
			hasRequestedDeviceAccess={viewModel.hasRequestedDeviceAccess}
			isCameraEnabled={viewModel.isCameraEnabled}
			isMicEnabled={viewModel.isMicEnabled}
			isSpeakerSelectionSupported={viewModel.isSpeakerSelectionSupported}
			isSpeakerTestSupported={viewModel.isSpeakerTestSupported}
			isTestingSpeaker={viewModel.isTestingSpeaker}
			micLevel={viewModel.micLevel}
			onRefreshDevices={() => {
				void viewModel.handleRefreshDevices();
			}}
			onSelectAudioInput={(deviceId) => {
				void viewModel.handleSelectAudioInput(deviceId);
			}}
			onSelectAudioOutput={(deviceId) => {
				void viewModel.handleSelectAudioOutput(deviceId);
			}}
			onSelectVideoInput={(deviceId) => {
				void viewModel.handleSelectVideoInput(deviceId);
			}}
			onStartPreview={() => {
				void viewModel.handleStartPreview();
			}}
			onStopPreview={() => {
				void viewModel.handleStopPreview();
			}}
			onTestSpeaker={() => {
				void viewModel.handleTestSpeaker();
			}}
			previewStatus={viewModel.previewStatus}
			previewVideoRef={viewModel.previewVideoRef}
			selectedAudioInputId={viewModel.selectedAudioInputId}
			selectedAudioOutputId={viewModel.selectedAudioOutputId}
			selectedVideoInputId={viewModel.selectedVideoInputId}
			speakerTestAudioRef={viewModel.speakerTestAudioRef}
			videoInputExposure={viewModel.videoInputExposure}
			videoInputOptions={viewModel.videoInputOptions}
		/>
	);

	return (
		<PageShell>
			<PageContainer>
				<Panel className="py-4">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<SectionHeader
							description={
								<>Le salon expire le {formatDate(room.expiresAt)}.</>
							}
							eyebrow="Salon visio"
							title={`Hébergé par ${room.hostDisplayName}`}
							titleAs="h1"
						/>
						<div className="flex flex-wrap gap-2">
							<StatusPill
								label={
									room.settings.requireJoinAuth
										? "Authentification requise"
										: "Accès par lien activé"
								}
							/>
							<StatusPill
								label={
									room.settings.requireWaitingRoom
										? "Salle d'attente active"
										: "Entrée instantanée"
								}
							/>
							<StatusPill
								label={
									room.settingsLocked
										? "Réglages verrouillés"
										: "Réglages modifiables"
								}
							/>
						</div>
					</div>

					{viewModel.error ? (
						<Alert className="mt-4" variant="danger">
							{viewModel.error}
						</Alert>
					) : null}

					{viewModel.notice ? (
						<Alert className="mt-4" variant="warning">
							{viewModel.notice}
						</Alert>
					) : null}
				</Panel>

				{joinableState ? (
					<div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
						<section className="space-y-6">
							<Panel>
								<SectionHeader
									eyebrow="Rejoindre"
									title="Entrer dans le salon."
								/>
								{joinableState.viewerCanJoin ? (
									<form
										className="mt-6 space-y-4"
										onSubmit={viewModel.handleJoinSubmit}
									>
										<Field
											htmlFor="visio-join-display-name"
											label="Nom d'affichage"
										>
											<Input
												id="visio-join-display-name"
												onChange={(event) => {
													viewModel.setJoinName(event.target.value);
												}}
												required
												type="text"
												value={viewModel.joinName}
											/>
										</Field>
										<Button disabled={viewModel.isBusy} type="submit">
											{viewModel.isBusy ? "Entrée..." : "Rejoindre le salon"}
										</Button>
									</form>
								) : (
									<div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
										<h2 className="font-semibold text-slate-950 text-xl">
											Connectez-vous avant de rejoindre.
										</h2>
										<p className="mt-2 text-slate-600 text-sm leading-6">
											Cet hôte exige que chaque invité soit authentifié avant
											d'entrer dans le salon.
										</p>
										<Button
											className="mt-4"
											onClick={viewModel.handleSignIn}
											type="button"
										>
											Se connecter avec GitHub
										</Button>
									</div>
								)}
							</Panel>

							<Panel tone="dark">
								<SectionHeader
									description={
										<>
											Un seul invité peut être actif à la fois. Si un autre
											invité a déjà rejoint ou attend, ce salon restera plein
											jusqu'à son départ.
										</>
									}
									eyebrow="Détails du salon"
									inverted
									title="Un invité actif"
								/>
							</Panel>
						</section>

						<div>{devicePanel}</div>
					</div>
				) : null}

				{pendingState ? (
					<div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
						<Panel className="border-amber-200">
							<SectionHeader
								description={
									<>
										Vous avez rejoint en tant que{" "}
										{pendingState.self.displayName}. Gardez cette page ouverte
										pendant que l'hôte examine votre demande.
									</>
								}
								eyebrow="Salle d'attente"
								title="En attente de l'admission par l'hôte."
							/>
							<Button
								className="mt-6"
								onClick={viewModel.handleLeave}
								type="button"
								variant="secondary"
							>
								Quitter la salle d'attente
							</Button>
						</Panel>

						<div>{devicePanel}</div>
					</div>
				) : null}

				{inCallState ? (
					<div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
						<section className="space-y-6">
							<div className="grid gap-6 md:grid-cols-2">
								<VideoPanel
									label={inCallState.self.role === "host" ? "Hôte" : "Vous"}
									name={inCallState.self.displayName}
									status={
										viewModel.hasLocalMedia
											? "Les périphériques locaux sont prêts"
											: "L'aperçu média est encore désactivé"
									}
									videoRef={viewModel.localVideoRef}
								/>
								<VideoPanel
									label="Distant"
									name={inCallState.peer?.displayName ?? "En attente du pair"}
									status={
										viewModel.hasRemoteMedia
											? `Connexion ${viewModel.connectionState}`
											: "Aucun flux distant pour le moment"
									}
									videoRef={viewModel.remoteVideoRef}
								/>
							</div>

							<Panel>
								<SectionHeader
									eyebrow="Contrôles d'appel"
									title="Gérer l'appel"
								/>
								<div className="mt-5 flex flex-wrap gap-3">
									<Button
										disabled={
											viewModel.isBusy ||
											viewModel.previewStatus === "requesting"
										}
										onClick={() => {
											void viewModel.handleStartPreview();
										}}
										type="button"
									>
										{viewModel.previewStatus === "requesting"
											? "Demande des médias..."
											: viewModel.hasLocalMedia
												? "Relancer l'aperçu local"
												: "Activer caméra et microphone"}
									</Button>
									<Button
										disabled={!viewModel.hasLocalMedia}
										onClick={() => {
											viewModel.handleToggleTrack("audio");
										}}
										type="button"
										variant="secondary"
									>
										{viewModel.isMicEnabled
											? "Couper le microphone"
											: "Activer le microphone"}
									</Button>
									<Button
										disabled={!viewModel.hasLocalMedia}
										onClick={() => {
											viewModel.handleToggleTrack("video");
										}}
										type="button"
										variant="secondary"
									>
										{viewModel.isCameraEnabled
											? "Désactiver la caméra"
											: "Activer la caméra"}
									</Button>
									<Button
										onClick={viewModel.handleLeave}
										type="button"
										variant="danger"
									>
										{inCallState.self.role === "host"
											? "Terminer le salon"
											: "Quitter le salon"}
									</Button>
								</div>
							</Panel>
						</section>

						<section className="space-y-6">
							{devicePanel}

							<Panel tone="dark">
								<SectionHeader
									eyebrow="Partager le salon"
									inverted
									title="Lien d'invitation"
								/>
								<p className="mt-4 break-all text-sky-200 text-sm leading-6">
									{typeof window === "undefined"
										? inCallState.room.sharePath
										: new URL(
												inCallState.room.sharePath,
												window.location.origin,
											).toString()}
								</p>
								<Button
									className="mt-4 bg-white text-slate-900 hover:bg-slate-100"
									onClick={() => {
										void viewModel.handleCopyLink();
									}}
									type="button"
								>
									{viewModel.isCopied
										? "Lien copié"
										: "Copier le lien du salon"}
								</Button>
							</Panel>

							{inCallState.self.role === "host" ? (
								<>
									{!inCallState.room.settingsLocked && settingsDraft ? (
										<FormPanel onSubmit={viewModel.handleSettingsSubmit}>
											<SectionHeader
												eyebrow="Accès du salon"
												title="Réglages d'accès"
											/>
											<div className="mt-5 space-y-3">
												<CheckboxRow
													checked={settingsDraft.requireJoinAuth}
													onChange={(event) => {
														viewModel.setSettingsDraft({
															...settingsDraft,
															requireJoinAuth: event.target.checked,
														});
													}}
													type="controlled"
												>
													Exiger la connexion des invités avant l'entrée
												</CheckboxRow>
												<CheckboxRow
													checked={settingsDraft.requireWaitingRoom}
													onChange={(event) => {
														viewModel.setSettingsDraft({
															...settingsDraft,
															requireWaitingRoom: event.target.checked,
														});
													}}
													type="controlled"
												>
													Exiger l'approbation de l'hôte avant le début de
													l'appel
												</CheckboxRow>
											</div>
											<Button
												className="mt-5"
												disabled={viewModel.isBusy}
												type="submit"
											>
												{viewModel.isBusy
													? "Enregistrement..."
													: "Enregistrer les réglages du salon"}
											</Button>
										</FormPanel>
									) : null}

									{inCallState.pendingGuest ? (
										<Panel className="border-amber-200">
											<SectionHeader
												eyebrow="Salle d'attente"
												title={`${inCallState.pendingGuest.displayName} souhaite rejoindre.`}
											/>
											<div className="mt-5 flex flex-wrap gap-3">
												<Button
													onClick={() => {
														if (!inCallState.pendingGuest) {
															return;
														}
														viewModel.handleAdmissionDecision(
															inCallState.pendingGuest.participantId,
															"approve",
														);
													}}
													type="button"
												>
													Approuver l'invité
												</Button>
												<Button
													onClick={() => {
														if (!inCallState.pendingGuest) {
															return;
														}
														viewModel.handleAdmissionDecision(
															inCallState.pendingGuest.participantId,
															"reject",
														);
													}}
													type="button"
													variant="danger"
												>
													Refuser l'invité
												</Button>
											</div>
										</Panel>
									) : null}
								</>
							) : null}
						</section>
					</div>
				) : null}

				{fullState ? (
					<Panel className="border-red-200">
						<SectionHeader
							description="Un seul invité peut être actif à la fois. Réessayez après le départ de l'invité actuel ou le refus de la demande en attente par l'hôte."
							eyebrow="Salon plein"
							title="Un autre invité utilise déjà ce salon."
						/>
					</Panel>
				) : null}

				{rejectedState ? (
					<Panel className="border-red-200">
						<SectionHeader
							description={
								<>
									Vous étiez dans le salon en tant que{" "}
									{rejectedState.self.displayName}. Demandez une nouvelle
									invitation à l'hôte si vous devez encore rejoindre.
								</>
							}
							eyebrow="Refusé"
							title="L'hôte n'a pas admis cette demande."
						/>
					</Panel>
				) : null}

				{expiredState ? (
					<Panel className="border-amber-200">
						<SectionHeader
							description="Les salons se ferment automatiquement après 24 heures pour le MVP local-first."
							eyebrow="Expiré"
							title="Ce salon visio a expiré."
						/>
					</Panel>
				) : null}
			</PageContainer>
		</PageShell>
	);
}
