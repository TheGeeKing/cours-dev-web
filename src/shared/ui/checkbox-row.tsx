import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function CheckboxRow(props: {
	children: ReactNode;
	checked?: boolean;
	className?: string;
	defaultChecked?: boolean;
	name?: string;
	onChange?: ComponentPropsWithoutRef<"input">["onChange"];
	type?: "controlled" | "uncontrolled";
}) {
	const inputProps =
		props.type === "controlled"
			? { checked: props.checked, onChange: props.onChange }
			: { defaultChecked: props.defaultChecked };

	return (
		<label
			className={cn(
				"flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3",
				props.className,
			)}
		>
			<input
				className="mt-1 size-4 rounded border-slate-300"
				name={props.name}
				type="checkbox"
				{...inputProps}
			/>
			<span className="text-slate-700 text-sm leading-6">{props.children}</span>
		</label>
	);
}
