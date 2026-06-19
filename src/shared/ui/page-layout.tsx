import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function PageShell(props: { children: ReactNode; className?: string }) {
	return (
		<main
			className={cn(
				"min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8",
				props.className,
			)}
		>
			{props.children}
		</main>
	);
}

export function PageContainer(props: {
	children: ReactNode;
	className?: string;
	size?: "narrow" | "wide";
}) {
	return (
		<div
			className={cn(
				"mx-auto flex w-full flex-col gap-6",
				props.size === "narrow" ? "max-w-3xl" : "max-w-6xl",
				props.className,
			)}
		>
			{props.children}
		</div>
	);
}
