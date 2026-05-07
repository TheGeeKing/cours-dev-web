"use client";

import type { RefObject } from "react";

import type { VisioIceServer, VisioRoomPageState } from "@/features/visio/model/visio.types";
import { VisioDevicePanel } from "@/features/visio/view/visio-device-panel";
import { useVisioRoomViewModel } from "@/features/visio/view-model/use-visio-room-view-model";

const formatDate = (value: string) =>
	new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));

function StatusPill(props: { label: string }) {
	return (
		<span className="rounded-full border border-stone-900/10 bg-stone-100 px-3 py-1 font-medium text-sm text-stone-700">
			{props.label}
		</span>
	);
}

function VideoPanel(props: {
	label: string;
	name: string;
	status: string;
	videoRef: RefObject<HTMLVideoElement | null>;
}) {
	return (
		<section className="overflow-hidden rounded-[1.75rem] border border-stone-900/10 bg-white shadow-[0_18px_48px_rgba(41,37,36,0.08)]">
			<div className="aspect-video bg-stone-950">
				<video
					autoPlay
					className="size-full object-cover"
					muted={props.label !== "Remote"}
					playsInline
					ref={props.videoRef}
				/>
			</div>
			<div className="space-y-2 p-5">
				<p className="font-semibold text-emerald-700 text-sm uppercase tracking-[0.3em]">
					{props.label}
				</p>
				<h3 className="font-semibold text-xl text-stone-950">{props.name}</h3>
				<p className="text-sm text-stone-600 leading-6">{props.status}</p>
			</div>
		</section>
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
			<main className="min-h-screen bg-[linear-gradient(180deg,#f7f3eb_0%,#dfe8dc_45%,#f2ede2_100%)] px-4 py-10 text-stone-900 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-3xl rounded-[2rem] border border-stone-900/10 bg-white/85 p-8 shadow-[0_24px_80px_rgba(41,37,36,0.12)] backdrop-blur">
					<p className="font-semibold text-stone-600 text-sm uppercase tracking-[0.35em]">
						Unavailable
					</p>
					<h1 className="mt-4 font-black text-4xl text-stone-950 tracking-tight">
						This visio room is no longer available.
					</h1>
					<p className="mt-3 max-w-2xl text-sm text-stone-600 leading-6">
						The room link may be invalid, or the host may already have ended the
						call.
					</p>
				</div>
			</main>
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

	const devicePanel = (
		<VisioDevicePanel
			audioInputOptions={viewModel.audioInputOptions}
			audioInputExposure={viewModel.audioInputExposure}
			audioOutputOptions={viewModel.audioOutputOptions}
			audioOutputExposure={viewModel.audioOutputExposure}
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
			videoInputOptions={viewModel.videoInputOptions}
			videoInputExposure={viewModel.videoInputExposure}
		/>
	);

	return (
		<main className="min-h-screen bg-[linear-gradient(180deg,#f7f3eb_0%,#dfe8dc_45%,#f2ede2_100%)] px-4 py-10 text-stone-900 sm:px-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
				<section className="rounded-[1.75rem] border border-stone-900/10 bg-white/75 px-6 py-5 shadow-[0_16px_48px_rgba(41,37,36,0.08)] backdrop-blur">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div className="space-y-3">
							<p className="font-semibold text-emerald-700 text-sm uppercase tracking-[0.3em]">
								Visio room
							</p>
							<div>
								<h1 className="font-black text-3xl text-stone-950 tracking-tight">
									Hosted by {room.hostDisplayName}
								</h1>
								<p className="mt-2 text-sm text-stone-600 leading-6">
									Room expires on {formatDate(room.expiresAt)}.
								</p>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							<StatusPill
								label={
									room.settings.requireJoinAuth
										? "Auth required"
										: "Link join enabled"
								}
							/>
							<StatusPill
								label={
									room.settings.requireWaitingRoom
										? "Waiting room on"
										: "Instant join"
								}
							/>
							<StatusPill
								label={
									room.settingsLocked
										? "Settings locked"
										: "Settings editable"
								}
							/>
						</div>
					</div>

					{viewModel.error ? (
						<p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{viewModel.error}
						</p>
					) : null}

					{viewModel.notice ? (
						<p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
							{viewModel.notice}
						</p>
					) : null}
				</section>

				{joinableState ? (
					<div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
						<section className="space-y-6">
							<section className="rounded-[1.75rem] border border-stone-900/10 bg-white p-6 shadow-[0_18px_48px_rgba(41,37,36,0.08)]">
								<p className="font-semibold text-emerald-700 text-sm uppercase tracking-[0.3em]">
									Join
								</p>
								<h2 className="mt-3 font-black text-3xl text-stone-950 tracking-tight">
									Enter the room.
								</h2>
								{joinableState.viewerCanJoin ? (
									<form className="mt-6 space-y-4" onSubmit={viewModel.handleJoinSubmit}>
										<label className="block">
											<span className="mb-2 block font-medium text-sm text-stone-700">
												Display name
											</span>
											<input
												className="block w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900"
												onChange={(event) => {
													viewModel.setJoinName(event.target.value);
												}}
												required
												type="text"
												value={viewModel.joinName}
											/>
										</label>
										<button
											className="inline-flex items-center rounded-full bg-stone-950 px-5 py-3 font-semibold text-sm text-stone-50 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-400"
											disabled={viewModel.isBusy}
											type="submit"
										>
											{viewModel.isBusy ? "Joining..." : "Join room"}
										</button>
									</form>
								) : (
									<div className="mt-6 rounded-[1.5rem] border border-stone-900/10 bg-stone-50 p-5">
										<h2 className="font-semibold text-xl text-stone-950">
											Sign in before joining.
										</h2>
										<p className="mt-2 text-sm text-stone-600 leading-6">
											This host requires every guest to be authenticated before
											entering the room.
										</p>
										<button
											className="mt-4 rounded-full bg-emerald-400 px-5 py-3 font-semibold text-sm text-stone-950 transition hover:bg-emerald-300"
											onClick={viewModel.handleSignIn}
											type="button"
										>
											Sign in with GitHub
										</button>
									</div>
								)}
							</section>

							<section className="rounded-[1.75rem] border border-stone-900/10 bg-stone-950 p-6 text-stone-50 shadow-[0_18px_48px_rgba(41,37,36,0.16)]">
								<p className="font-semibold text-emerald-300 text-sm uppercase tracking-[0.3em]">
									Room details
								</p>
								<p className="mt-4 text-sm text-stone-300 leading-6">
									Only one guest can be active at a time. If another guest already
									joined or is waiting, this room will stay full until they leave.
								</p>
							</section>
						</section>

						<div>{devicePanel}</div>
					</div>
				) : null}

				{pendingState ? (
					<div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
						<section className="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-[0_18px_48px_rgba(41,37,36,0.08)]">
							<p className="font-semibold text-amber-700 text-sm uppercase tracking-[0.3em]">
								Waiting room
							</p>
							<h2 className="mt-3 font-black text-3xl text-stone-950 tracking-tight">
								Waiting for the host to admit you.
							</h2>
							<p className="mt-3 max-w-2xl text-sm text-stone-600 leading-6">
								You joined as {pendingState.self.displayName}. Keep this page open
								while the host reviews your request.
							</p>
							<button
								className="mt-6 rounded-full border border-stone-300 px-5 py-3 font-semibold text-sm text-stone-900 transition hover:border-stone-500"
								onClick={viewModel.handleLeave}
								type="button"
							>
								Leave waiting room
							</button>
						</section>

						<div>{devicePanel}</div>
					</div>
				) : null}

				{inCallState ? (
					<div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
						<section className="space-y-6">
							<div className="grid gap-6 md:grid-cols-2">
								<VideoPanel
									label={inCallState.self.role === "host" ? "Host" : "You"}
									name={inCallState.self.displayName}
									status={
										viewModel.hasLocalMedia
											? "Local devices are ready"
											: "Media preview is still off"
									}
									videoRef={viewModel.localVideoRef}
								/>
								<VideoPanel
									label="Remote"
									name={inCallState.peer?.displayName ?? "Waiting for peer"}
									status={
										viewModel.hasRemoteMedia
											? `Connection ${viewModel.connectionState}`
											: "No remote stream yet"
									}
									videoRef={viewModel.remoteVideoRef}
								/>
							</div>

							<section className="rounded-[1.75rem] border border-stone-900/10 bg-white p-6 shadow-[0_18px_48px_rgba(41,37,36,0.08)]">
								<p className="font-semibold text-emerald-700 text-sm uppercase tracking-[0.3em]">
									Call controls
								</p>
								<div className="mt-5 flex flex-wrap gap-3">
									<button
										className="rounded-full bg-stone-950 px-5 py-3 font-semibold text-sm text-stone-50 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-400"
										disabled={viewModel.isBusy || viewModel.previewStatus === "requesting"}
										onClick={() => {
											void viewModel.handleStartPreview();
										}}
										type="button"
									>
										{viewModel.previewStatus === "requesting"
											? "Requesting media..."
											: viewModel.hasLocalMedia
												? "Restart local preview"
												: "Enable camera and microphone"}
									</button>
									<button
										className="rounded-full border border-stone-300 px-5 py-3 font-semibold text-sm text-stone-900 transition hover:border-stone-500 disabled:cursor-not-allowed disabled:opacity-60"
										disabled={!viewModel.hasLocalMedia}
										onClick={() => {
											viewModel.handleToggleTrack("audio");
										}}
										type="button"
									>
										{viewModel.isMicEnabled ? "Mute microphone" : "Unmute microphone"}
									</button>
									<button
										className="rounded-full border border-stone-300 px-5 py-3 font-semibold text-sm text-stone-900 transition hover:border-stone-500 disabled:cursor-not-allowed disabled:opacity-60"
										disabled={!viewModel.hasLocalMedia}
										onClick={() => {
											viewModel.handleToggleTrack("video");
										}}
										type="button"
									>
										{viewModel.isCameraEnabled ? "Turn camera off" : "Turn camera on"}
									</button>
									<button
										className="rounded-full border border-red-200 px-5 py-3 font-semibold text-sm text-red-700 transition hover:bg-red-50"
										onClick={viewModel.handleLeave}
										type="button"
									>
										{inCallState.self.role === "host" ? "End room" : "Leave room"}
									</button>
								</div>
							</section>
						</section>

						<section className="space-y-6">
							{devicePanel}

							<section className="rounded-[1.75rem] border border-stone-900/10 bg-stone-950 p-6 text-stone-50 shadow-[0_18px_48px_rgba(41,37,36,0.16)]">
								<p className="font-semibold text-emerald-300 text-sm uppercase tracking-[0.3em]">
									Share room
								</p>
								<p className="mt-4 break-all text-sm text-emerald-200 leading-6">
									{typeof window === "undefined"
										? inCallState.room.sharePath
										: new URL(
												inCallState.room.sharePath,
												window.location.origin,
											).toString()}
								</p>
								<button
									className="mt-4 rounded-full bg-emerald-400 px-5 py-3 font-semibold text-sm text-stone-950 transition hover:bg-emerald-300"
									onClick={() => {
										void viewModel.handleCopyLink();
									}}
									type="button"
								>
									{viewModel.isCopied ? "Link copied" : "Copy room link"}
								</button>
							</section>

							{inCallState.self.role === "host" ? (
								<>
									{!inCallState.room.settingsLocked && viewModel.settingsDraft ? (
										<form
											className="rounded-[1.75rem] border border-stone-900/10 bg-white p-6 shadow-[0_18px_48px_rgba(41,37,36,0.08)]"
											onSubmit={viewModel.handleSettingsSubmit}
										>
											<p className="font-semibold text-emerald-700 text-sm uppercase tracking-[0.3em]">
												Room gates
											</p>
											<div className="mt-5 space-y-3">
												<label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
													<input
														checked={viewModel.settingsDraft.requireJoinAuth}
														className="mt-1 size-4"
														onChange={(event) => {
															viewModel.setSettingsDraft({
																...viewModel.settingsDraft!,
																requireJoinAuth: event.target.checked,
															});
														}}
														type="checkbox"
													/>
													<span className="text-sm text-stone-700">
														Require guests to sign in before joining
													</span>
												</label>
												<label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
													<input
														checked={viewModel.settingsDraft.requireWaitingRoom}
														className="mt-1 size-4"
														onChange={(event) => {
															viewModel.setSettingsDraft({
																...viewModel.settingsDraft!,
																requireWaitingRoom: event.target.checked,
															});
														}}
														type="checkbox"
													/>
													<span className="text-sm text-stone-700">
														Require host approval before the call starts
													</span>
												</label>
											</div>
											<button
												className="mt-5 rounded-full bg-stone-950 px-5 py-3 font-semibold text-sm text-stone-50 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-400"
												disabled={viewModel.isBusy}
												type="submit"
											>
												{viewModel.isBusy ? "Saving..." : "Save room settings"}
											</button>
										</form>
									) : null}

									{inCallState.pendingGuest ? (
										<section className="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-[0_18px_48px_rgba(41,37,36,0.08)]">
											<p className="font-semibold text-amber-700 text-sm uppercase tracking-[0.3em]">
												Waiting room
											</p>
											<h2 className="mt-3 font-semibold text-2xl text-stone-950">
												{inCallState.pendingGuest.displayName} wants to join.
											</h2>
											<div className="mt-5 flex flex-wrap gap-3">
												<button
													className="rounded-full bg-stone-950 px-5 py-3 font-semibold text-sm text-stone-50 transition hover:bg-emerald-700"
													onClick={() => {
														viewModel.handleAdmissionDecision(
															inCallState.pendingGuest!.participantId,
															"approve",
														);
													}}
													type="button"
												>
													Approve guest
												</button>
												<button
													className="rounded-full border border-red-200 px-5 py-3 font-semibold text-sm text-red-700 transition hover:bg-red-50"
													onClick={() => {
														viewModel.handleAdmissionDecision(
															inCallState.pendingGuest!.participantId,
															"reject",
														);
													}}
													type="button"
												>
													Reject guest
												</button>
											</div>
										</section>
									) : null}
								</>
							) : null}
						</section>
					</div>
				) : null}

				{fullState ? (
					<section className="rounded-[1.75rem] border border-red-200 bg-white p-6 shadow-[0_18px_48px_rgba(41,37,36,0.08)]">
						<p className="font-semibold text-red-700 text-sm uppercase tracking-[0.3em]">
							Room full
						</p>
						<h2 className="mt-3 font-black text-3xl text-stone-950 tracking-tight">
							Another guest is already using this room.
						</h2>
						<p className="mt-3 max-w-2xl text-sm text-stone-600 leading-6">
							Only one guest can be active at a time. Try again after the current
							guest leaves or the host rejects the pending request.
						</p>
					</section>
				) : null}

				{rejectedState ? (
					<section className="rounded-[1.75rem] border border-red-200 bg-white p-6 shadow-[0_18px_48px_rgba(41,37,36,0.08)]">
						<p className="font-semibold text-red-700 text-sm uppercase tracking-[0.3em]">
							Rejected
						</p>
						<h2 className="mt-3 font-black text-3xl text-stone-950 tracking-tight">
							The host did not admit this request.
						</h2>
						<p className="mt-3 max-w-2xl text-sm text-stone-600 leading-6">
							You were in the room as {rejectedState.self.displayName}. Ask the
							host for a new invitation if you still need to join.
						</p>
					</section>
				) : null}

				{expiredState ? (
					<section className="rounded-[1.75rem] border border-amber-200 bg-white p-6 shadow-[0_18px_48px_rgba(41,37,36,0.08)]">
						<p className="font-semibold text-amber-700 text-sm uppercase tracking-[0.3em]">
							Expired
						</p>
						<h2 className="mt-3 font-black text-3xl text-stone-950 tracking-tight">
							This visio room expired.
						</h2>
						<p className="mt-3 max-w-2xl text-sm text-stone-600 leading-6">
							Rooms automatically close after 24 hours for the local-first MVP.
						</p>
					</section>
				) : null}
			</div>
		</main>
	);
}
