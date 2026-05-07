"use client";

import Link from "next/link";

import { useVisioCreateRoomViewModel } from "@/features/visio/view-model/use-visio-create-room-view-model";

const formatDate = (value: string) =>
	new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));

export function VisioCreateRoomForm(props: { defaultDisplayName: string }) {
	const viewModel = useVisioCreateRoomViewModel();

	return (
		<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<form
				className="rounded-[1.75rem] border border-stone-900/10 bg-white p-6 shadow-[0_18px_48px_rgba(41,37,36,0.08)]"
				onSubmit={viewModel.handleSubmit}
			>
				<div className="space-y-3">
					<p className="font-semibold text-emerald-700 text-sm uppercase tracking-[0.3em]">
						Host workspace
					</p>
					<h1 className="font-black text-3xl text-stone-950 tracking-tight">
						Create a one-to-one video room.
					</h1>
					<p className="max-w-xl text-sm text-stone-600 leading-6">
						Set your display name, choose the room gates you want, and create a
						share link for the guest.
					</p>
				</div>

				<label className="mt-6 block">
					<span className="mb-2 block font-medium text-sm text-stone-700">
						Host display name
					</span>
					<input
						className="block w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900"
						defaultValue={props.defaultDisplayName}
						name="hostDisplayName"
						required
						type="text"
					/>
				</label>

				<div className="mt-6 space-y-3">
					<label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
						<input
							className="mt-1 size-4"
							name="requireJoinAuth"
							type="checkbox"
						/>
						<span>
							<span className="block font-medium text-sm text-stone-900">
								Require sign-in for guests
							</span>
							<span className="mt-1 block text-sm text-stone-600 leading-6">
								Anyone with the link can still reach the room page, but joining
								the call will require GitHub auth.
							</span>
						</span>
					</label>

					<label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
						<input
							className="mt-1 size-4"
							name="requireWaitingRoom"
							type="checkbox"
						/>
						<span>
							<span className="block font-medium text-sm text-stone-900">
								Enable a waiting room
							</span>
							<span className="mt-1 block text-sm text-stone-600 leading-6">
								Guests enter a pending state until you approve them from the
								room page.
							</span>
						</span>
					</label>
				</div>

				{viewModel.error ? (
					<p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{viewModel.error}
					</p>
				) : null}

				<button
					className="mt-6 inline-flex items-center rounded-full bg-stone-950 px-5 py-3 font-semibold text-sm text-stone-50 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-400"
					disabled={viewModel.isPending}
					type="submit"
				>
					{viewModel.isPending ? "Creating room..." : "Create room"}
				</button>
			</form>

			<section className="rounded-[1.75rem] border border-stone-900/10 bg-stone-950 p-6 text-stone-50 shadow-[0_18px_48px_rgba(41,37,36,0.16)]">
				<p className="font-semibold text-emerald-300 text-sm uppercase tracking-[0.3em]">
					Share
				</p>
				{viewModel.result ? (
					<div className="mt-4 space-y-4">
						<div>
							<h2 className="font-semibold text-2xl">
								Room ready for {viewModel.result.hostDisplayName}
							</h2>
							<p className="mt-2 text-sm text-stone-300 leading-6">
								The room stays available until{" "}
								{formatDate(viewModel.result.expiresAt)} unless you end it first.
							</p>
						</div>
						<dl className="grid gap-3 text-sm">
							<div className="rounded-2xl border border-stone-50/10 bg-stone-900 px-4 py-3">
								<dt className="text-stone-400">Guest access</dt>
								<dd className="mt-1 font-medium">
									{viewModel.result.settings.requireJoinAuth
										? "Signed-in guests only"
										: "Anyone with the link can join"}
								</dd>
							</div>
							<div className="rounded-2xl border border-stone-50/10 bg-stone-900 px-4 py-3">
								<dt className="text-stone-400">Admission</dt>
								<dd className="mt-1 font-medium">
									{viewModel.result.settings.requireWaitingRoom
										? "Manual host approval"
										: "Immediate join"}
								</dd>
							</div>
							<div className="rounded-2xl border border-stone-50/10 bg-stone-900 px-4 py-3">
								<dt className="text-stone-400">Room link</dt>
								<dd className="mt-2 break-all font-medium text-emerald-200">
									{viewModel.result.shareUrl}
								</dd>
							</div>
						</dl>
						<div className="flex flex-wrap gap-3">
							<button
								className="rounded-full bg-emerald-400 px-5 py-3 font-semibold text-sm text-stone-950 transition hover:bg-emerald-300"
								onClick={() => {
									void viewModel.handleCopyLink();
								}}
								type="button"
							>
								{viewModel.isCopied ? "Link copied" : "Copy room link"}
							</button>
							<Link
								className="inline-flex items-center rounded-full border border-stone-50/20 px-5 py-3 font-semibold text-sm text-stone-50 transition hover:border-emerald-300 hover:text-emerald-200"
								href={viewModel.result.sharePath}
							>
								Open room
							</Link>
						</div>
					</div>
				) : (
					<p className="mt-4 text-sm text-stone-300 leading-6">
						Your guest link and room summary will appear here as soon as the
						room is created.
					</p>
				)}
			</section>
		</div>
	);
}
