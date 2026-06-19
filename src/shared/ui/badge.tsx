import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type BadgeVariant =
	| "neutral"
	| "success"
	| "warning"
	| "danger"
	| "info";

export function Badge({
	children,
	className,
	variant = "neutral",
}: {
	children: ReactNode;
	className?: string;
	variant?: BadgeVariant;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2.5 py-1 font-medium text-xs",
				variant === "neutral" && "border-slate-200 bg-slate-100 text-slate-700",
				variant === "success" &&
					"border-emerald-200 bg-emerald-50 text-emerald-700",
				variant === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
				variant === "danger" && "border-red-200 bg-red-50 text-red-700",
				variant === "info" && "border-sky-200 bg-sky-50 text-sky-700",
				className,
			)}
		>
			{children}
		</span>
	);
}
