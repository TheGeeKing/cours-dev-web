"use client";

import { useState, useTransition } from "react";

import type { VisioCreateRoomResponse } from "@/features/visio/model/visio.types";

type CreateRoomResult = VisioCreateRoomResponse & {
	shareUrl: string;
};

export const useVisioCreateRoomViewModel = () => {
	const [result, setResult] = useState<CreateRoomResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isCopied, setIsCopied] = useState(false);
	const [isPending, startTransition] = useTransition();

	const submitRoom = async (formData: FormData) => {
		setError(null);
		setIsCopied(false);

		const payload = {
			hostDisplayName: String(formData.get("hostDisplayName") ?? ""),
			requireJoinAuth: formData.get("requireJoinAuth") === "on",
			requireWaitingRoom: formData.get("requireWaitingRoom") === "on",
		};

		const response = await fetch("/api/visio/rooms", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		const responsePayload = (await response.json().catch(() => null)) as
			| VisioCreateRoomResponse
			| { error?: string }
			| null;

		if (!response.ok) {
			setResult(null);
			setError(
				responsePayload && "error" in responsePayload
					? (responsePayload.error ?? "La création du salon a échoué.")
					: "La création du salon a échoué.",
			);
			return;
		}

		if (!responsePayload || !("sharePath" in responsePayload)) {
			setResult(null);
			setError(
				"La création du salon a réussi, mais le lien du salon est manquant.",
			);
			return;
		}

		setResult({
			...responsePayload,
			shareUrl: new URL(
				responsePayload.sharePath,
				window.location.origin,
			).toString(),
		});
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		startTransition(() => {
			void submitRoom(formData);
		});
	};

	const handleCopyLink = async () => {
		if (!result) {
			return;
		}

		try {
			await navigator.clipboard.writeText(result.shareUrl);
			setIsCopied(true);
		} catch {
			setError(
				"La copie a échoué. Vous pouvez toujours copier le lien du salon manuellement.",
			);
		}
	};

	return {
		error,
		result,
		isCopied,
		isPending,
		handleSubmit,
		handleCopyLink,
	};
};
