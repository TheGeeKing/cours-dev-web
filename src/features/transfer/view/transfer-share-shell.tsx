import type { TransferShareState } from "@/features/transfer/model/transfer.types";

const formatBytes = (bytes: number) =>
	new Intl.NumberFormat("en", {
		maximumFractionDigits: 1,
		notation: bytes >= 1024 * 1024 ? "compact" : "standard",
	}).format(bytes);

const formatDate = (value: Date) =>
	new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(value);

export function TransferShareShell(props: { state: TransferShareState }) {
	return (
		<main className="min-h-screen bg-[linear-gradient(180deg,#f7f3eb_0%,#dfe8dc_45%,#f2ede2_100%)] px-4 py-10 text-stone-900 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-3xl">
				<section className="rounded-[2rem] border border-stone-900/10 bg-white/85 p-8 shadow-[0_24px_80px_rgba(41,37,36,0.12)] backdrop-blur">
					{props.state.status === "ready" ? (
						<div className="space-y-6">
							<div className="space-y-3">
								<p className="font-semibold text-emerald-700 text-sm uppercase tracking-[0.35em]">
									Transfer
								</p>
								<h1 className="font-black text-4xl text-stone-950 tracking-tight">
									{props.state.transfer.originalFilename}
								</h1>
								<p className="text-sm text-stone-600 leading-6">
									This file is available until{" "}
									{formatDate(props.state.transfer.expiresAt)}.
								</p>
							</div>

							<dl className="grid gap-4 sm:grid-cols-2">
								<div className="rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-4">
									<dt className="text-sm text-stone-500">MIME type</dt>
									<dd className="mt-2 font-semibold">{props.state.transfer.mimeType}</dd>
								</div>
								<div className="rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-4">
									<dt className="text-sm text-stone-500">Size</dt>
									<dd className="mt-2 font-semibold">
										{formatBytes(props.state.transfer.sizeBytes)} bytes
									</dd>
								</div>
								<div className="rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-4">
									<dt className="text-sm text-stone-500">Created</dt>
									<dd className="mt-2 font-semibold">
										{formatDate(props.state.transfer.createdAt)}
									</dd>
								</div>
								<div className="rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-4">
									<dt className="text-sm text-stone-500">Expires</dt>
									<dd className="mt-2 font-semibold">
										{formatDate(props.state.transfer.expiresAt)}
									</dd>
								</div>
							</dl>

							<a
								className="inline-flex items-center rounded-full bg-stone-950 px-5 py-3 font-semibold text-sm text-stone-50 transition hover:bg-emerald-700"
								href={props.state.transfer.downloadPath}
							>
								Download file
							</a>
						</div>
					) : props.state.status === "expired" ? (
						<div className="space-y-4">
							<p className="font-semibold text-amber-700 text-sm uppercase tracking-[0.35em]">
								Expired
							</p>
							<h1 className="font-black text-4xl text-stone-950 tracking-tight">
								This transfer link has expired.
							</h1>
							<p className="max-w-2xl text-sm text-stone-600 leading-6">
								{props.state.originalFilename} was removed on{" "}
								{formatDate(props.state.expiredAt)} as part of the 7-day cleanup
								window.
							</p>
						</div>
					) : (
						<div className="space-y-4">
							<p className="font-semibold text-stone-600 text-sm uppercase tracking-[0.35em]">
								Not found
							</p>
							<h1 className="font-black text-4xl text-stone-950 tracking-tight">
								This transfer link does not exist.
							</h1>
							<p className="max-w-2xl text-sm text-stone-600 leading-6">
								The link may be invalid, already cleaned up, or missing its file.
							</p>
						</div>
					)}
				</section>
			</div>
		</main>
	);
}
