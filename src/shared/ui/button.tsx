import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function buttonClasses(
	variant: ButtonVariant = "primary",
	className?: string,
) {
	return cn(
		"inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 font-semibold text-sm transition disabled:cursor-not-allowed disabled:opacity-60",
		variant === "primary" && "bg-slate-900 text-white hover:bg-slate-700",
		variant === "secondary" &&
			"border border-slate-300 bg-white text-slate-900 hover:border-slate-400 hover:bg-slate-50",
		variant === "danger" &&
			"border border-red-200 bg-white text-red-700 hover:bg-red-50",
		variant === "ghost" && "text-slate-700 hover:bg-slate-100",
		className,
	);
}

export function Button({
	children,
	className,
	variant = "primary",
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
	return (
		<button className={buttonClasses(variant, className)} {...props}>
			{children}
		</button>
	);
}
