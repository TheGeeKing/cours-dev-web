import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function Field({
	children,
	className,
	htmlFor,
	label,
	help,
}: {
	children: ReactNode;
	className?: string;
	htmlFor: string;
	label: string;
	help?: ReactNode;
}) {
	return (
		<div className={cn("block", className)}>
			<label
				className="mb-2 block font-medium text-slate-700 text-sm"
				htmlFor={htmlFor}
			>
				{label}
			</label>
			{children}
			{help ? (
				<span className="mt-2 block text-slate-500 text-sm leading-6">
					{help}
				</span>
			) : null}
		</div>
	);
}
