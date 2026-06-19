import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

export function SectionHeader(props: {
	eyebrow?: string;
	title: ReactNode;
	description?: ReactNode;
	className?: string;
	inverted?: boolean;
	titleAs?: "h1" | "h2" | "h3";
}) {
	const Title = props.titleAs ?? "h2";

	return (
		<div className={cn("space-y-2", props.className)}>
			{props.eyebrow ? (
				<p
					className={cn(
						"font-semibold text-sm",
						props.inverted ? "text-slate-300" : "text-slate-500",
					)}
				>
					{props.eyebrow}
				</p>
			) : null}
			<Title
				className={cn(
					props.titleAs === "h1"
						? "font-bold text-3xl tracking-tight sm:text-4xl"
						: "font-bold text-2xl tracking-tight",
					props.inverted ? "text-white" : "text-slate-950",
				)}
			>
				{props.title}
			</Title>
			{props.description ? (
				<p
					className={cn(
						"max-w-2xl text-sm leading-6",
						props.inverted ? "text-slate-300" : "text-slate-600",
					)}
				>
					{props.description}
				</p>
			) : null}
		</div>
	);
}
