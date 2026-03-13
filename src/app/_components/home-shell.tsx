import type { ReactNode } from "react";

type HomeShellProps = {
	sessionLabel: string;
	sessionDescription: string;
	authAction: ReactNode;
};

const coreMilestones = [
	"Account profile and saved address",
	"Catalog grid and product details",
	"Cart, checkout, and order history",
];

const requiredLaterModules = [
	"Map integration",
	"Camera capture",
	"Media transfer",
	"1-to-1 video chat",
];

export function HomeShell(props: HomeShellProps) {
	return (
		<main className="min-h-screen bg-[linear-gradient(180deg,#f7f3eb_0%,#dfe8dc_45%,#f2ede2_100%)] px-4 py-10 text-stone-900 sm:px-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
				<section className="overflow-hidden rounded-[2rem] border border-stone-900/10 bg-white/80 shadow-[0_24px_80px_rgba(41,37,36,0.12)] backdrop-blur">
					<div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.5fr_0.9fr] lg:px-10 lg:py-10">
						<div className="space-y-6">
							<p className="font-semibold text-emerald-700 text-sm uppercase tracking-[0.35em]">
								Modular exam delivery baseline
							</p>
							<div className="space-y-4">
								<h1 className="max-w-3xl font-black text-4xl text-stone-950 tracking-tight sm:text-5xl">
									From scaffold to a real exam application.
								</h1>
								<p className="max-w-2xl text-base text-stone-700 leading-7 sm:text-lg">
									This repository now acts as the delivery shell for account,
									catalog, checkout, media, and video modules. The starter demo
									is removed so the next commits can build directly toward the
									exam flows.
								</p>
							</div>
							<div className="flex flex-wrap gap-3">
								<span className="rounded-full border border-stone-900/10 bg-stone-950 px-4 py-2 font-medium text-sm text-stone-50">
									GitHub OAuth first
								</span>
								<span className="rounded-full border border-emerald-700/20 bg-emerald-50 px-4 py-2 font-medium text-emerald-800 text-sm">
									MVVM is mandatory
								</span>
								<span className="rounded-full border border-stone-900/10 bg-stone-100 px-4 py-2 font-medium text-sm text-stone-700">
									Core flows before advanced modules
								</span>
							</div>
						</div>

						<div className="rounded-[1.5rem] border border-stone-900/10 bg-stone-950 p-6 text-stone-50">
							<p className="font-semibold text-emerald-300 text-sm uppercase tracking-[0.3em]">
								Session
							</p>
							<div className="mt-4 space-y-3">
								<h2 className="font-semibold text-2xl">{props.sessionLabel}</h2>
								<p className="min-h-12 text-sm text-stone-300 leading-6">
									{props.sessionDescription}
								</p>
							</div>
							<div className="mt-6">{props.authAction}</div>
						</div>
					</div>
				</section>

				<section className="grid gap-6 lg:grid-cols-2">
					<RoadmapCard
						description="These are the first product modules that turn the scaffold into the exam-ready app."
						items={coreMilestones}
						title="Core milestones"
					/>
					<RoadmapCard
						description="These modules stay required, but they come after the account and shop baseline is stable."
						items={requiredLaterModules}
						title="Required later modules"
					/>
				</section>
			</div>
		</main>
	);
}

function RoadmapCard(props: {
	title: string;
	description: string;
	items: string[];
}) {
	return (
		<section className="rounded-[1.75rem] border border-stone-900/10 bg-white/75 p-6 shadow-[0_16px_48px_rgba(41,37,36,0.08)] backdrop-blur">
			<div className="space-y-2">
				<h2 className="font-bold text-2xl text-stone-950">{props.title}</h2>
				<p className="text-sm text-stone-600 leading-6">{props.description}</p>
			</div>
			<ul className="mt-5 space-y-3">
				{props.items.map((item) => (
					<li
						className="rounded-2xl border border-stone-900/10 bg-stone-50 px-4 py-3 font-medium text-sm text-stone-700"
						key={item}
					>
						{item}
					</li>
				))}
			</ul>
		</section>
	);
}
