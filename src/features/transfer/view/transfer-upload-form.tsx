"use client";

import { useTransferUploadViewModel } from "@/features/transfer/view-model/use-transfer-upload-view-model";

const formatBytes = (bytes: number) =>
	new Intl.NumberFormat("en", {
		maximumFractionDigits: 1,
		notation: bytes >= 1024 * 1024 ? "compact" : "standard",
	}).format(bytes);

const formatDate = (value: string) =>
	new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));

export function TransferUploadForm() {
	const viewModel = useTransferUploadViewModel();

	return (
		<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<form
				className="rounded-[1.75rem] border border-stone-900/10 bg-white p-6 shadow-[0_18px_48px_rgba(41,37,36,0.08)]"
				onSubmit={viewModel.handleSubmit}
			>
				<div className="space-y-3">
					<p className="font-semibold text-emerald-700 text-sm uppercase tracking-[0.3em]">
						Upload
					</p>
					<h1 className="font-black text-3xl text-stone-950 tracking-tight">
						Create a private share link.
					</h1>
					<p className="max-w-xl text-sm text-stone-600 leading-6">
						Upload one file up to 100 MB. We store it locally, create an
						unguessable link, and remove it automatically after 7 days.
					</p>
				</div>

				<label className="mt-6 block">
					<span className="mb-2 block font-medium text-sm text-stone-700">
						File
					</span>
					<input
						className="block w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 file:mr-4 file:rounded-full file:border-0 file:bg-stone-950 file:px-4 file:py-2 file:font-semibold file:text-sm file:text-stone-50"
						name="file"
						type="file"
					/>
				</label>

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
					{viewModel.isPending ? "Uploading..." : "Upload and create link"}
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
								{viewModel.result.originalFilename}
							</h2>
							<p className="mt-2 text-sm text-stone-300 leading-6">
								This link stays active until {formatDate(viewModel.result.expiresAt)}.
							</p>
						</div>
						<dl className="grid gap-3 text-sm">
							<div className="rounded-2xl border border-stone-50/10 bg-stone-900 px-4 py-3">
								<dt className="text-stone-400">MIME type</dt>
								<dd className="mt-1 font-medium">{viewModel.result.mimeType}</dd>
							</div>
							<div className="rounded-2xl border border-stone-50/10 bg-stone-900 px-4 py-3">
								<dt className="text-stone-400">Size</dt>
								<dd className="mt-1 font-medium">
									{formatBytes(viewModel.result.sizeBytes)} bytes
								</dd>
							</div>
							<div className="rounded-2xl border border-stone-50/10 bg-stone-900 px-4 py-3">
								<dt className="text-stone-400">Link</dt>
								<dd className="mt-2 break-all font-medium text-emerald-200">
									{viewModel.result.shareUrl}
								</dd>
							</div>
						</dl>
						<button
							className="rounded-full bg-emerald-400 px-5 py-3 font-semibold text-sm text-stone-950 transition hover:bg-emerald-300"
							onClick={() => {
								void viewModel.handleCopyLink();
							}}
							type="button"
						>
							{viewModel.isCopied ? "Link copied" : "Copy share link"}
						</button>
					</div>
				) : (
					<p className="mt-4 text-sm text-stone-300 leading-6">
						Your shareable link will appear here right after upload.
					</p>
				)}
			</section>
		</div>
	);
}
