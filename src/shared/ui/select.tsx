import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib/cn";

export function Select({
	className,
	...props
}: ComponentPropsWithoutRef<"select">) {
	return (
		<select
			className={cn(
				"block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 text-sm shadow-xs disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70",
				className,
			)}
			{...props}
		/>
	);
}
