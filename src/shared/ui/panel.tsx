import type { ComponentPropsWithoutRef, FormHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

export type PanelTone = "default" | "muted" | "dark";

export function Panel({
	children,
	className,
	tone = "default",
	...props
}: ComponentPropsWithoutRef<"section"> & { tone?: PanelTone }) {
	return (
		<section
			className={cn(
				"rounded-xl border p-5 shadow-sm sm:p-6",
				tone === "dark"
					? "border-slate-800 bg-slate-900 text-slate-50"
					: tone === "muted"
						? "border-slate-200 bg-slate-100 text-slate-900"
						: "border-slate-200 bg-white text-slate-900",
				className,
			)}
			{...props}
		>
			{children}
		</section>
	);
}

export function FormPanel({
	children,
	className,
	...props
}: FormHTMLAttributes<HTMLFormElement>) {
	return (
		<form
			className={cn(
				"rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6",
				className,
			)}
			{...props}
		>
			{children}
		</form>
	);
}
