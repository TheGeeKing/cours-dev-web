import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export type AlertVariant = "info" | "success" | "warning" | "danger";

export function Alert({
	children,
	className,
	variant = "info",
}: {
	children: ReactNode;
	className?: string;
	variant?: AlertVariant;
}) {
	return (
		<p
			className={cn(
				"rounded-lg border px-4 py-3 text-sm leading-6",
				variant === "info" && "border-sky-200 bg-sky-50 text-sky-800",
				variant === "success" &&
					"border-emerald-200 bg-emerald-50 text-emerald-800",
				variant === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
				variant === "danger" && "border-red-200 bg-red-50 text-red-700",
				className,
			)}
		>
			{children}
		</p>
	);
}
