import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib/cn";

export function Input({
	className,
	...props
}: ComponentPropsWithoutRef<"input">) {
	return (
		<input
			className={cn(
				"block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 text-sm shadow-xs file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-semibold file:text-sm file:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70",
				className,
			)}
			{...props}
		/>
	);
}
