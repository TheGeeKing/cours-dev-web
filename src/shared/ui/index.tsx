import type {
	ButtonHTMLAttributes,
	ComponentPropsWithoutRef,
	FormHTMLAttributes,
	ReactNode,
} from "react";

type Tone = "default" | "muted" | "dark";
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";
type AlertVariant = "info" | "success" | "warning" | "danger";

export function cn(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function PageShell(props: { children: ReactNode; className?: string }) {
	return (
		<main
			className={cn(
				"min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8",
				props.className,
			)}
		>
			{props.children}
		</main>
	);
}

export function PageContainer(props: {
	children: ReactNode;
	className?: string;
	size?: "narrow" | "wide";
}) {
	return (
		<div
			className={cn(
				"mx-auto flex w-full flex-col gap-6",
				props.size === "narrow" ? "max-w-3xl" : "max-w-6xl",
				props.className,
			)}
		>
			{props.children}
		</div>
	);
}

export function Panel({
	children,
	className,
	tone = "default",
	...props
}: ComponentPropsWithoutRef<"section"> & { tone?: Tone }) {
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
