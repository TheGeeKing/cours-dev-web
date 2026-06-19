import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function DataList({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<dl className={cn("grid gap-3 text-sm sm:grid-cols-2", className)}>
			{children}
		</dl>
	);
}

export function InfoItem(props: {
	label: ReactNode;
	value: ReactNode;
	className?: string;
	inverted?: boolean;
}) {
	return (
		<div
			className={cn(
				"rounded-lg border px-4 py-3",
				props.inverted
					? "border-slate-700 bg-slate-800"
					: "border-slate-200 bg-slate-50",
				props.className,
			)}
		>
			<dt className={props.inverted ? "text-slate-400" : "text-slate-500"}>
				{props.label}
			</dt>
			<dd
				className={cn(
					"mt-1 font-medium",
					props.inverted ? "text-slate-50" : "text-slate-900",
				)}
			>
				{props.value}
			</dd>
		</div>
	);
}
