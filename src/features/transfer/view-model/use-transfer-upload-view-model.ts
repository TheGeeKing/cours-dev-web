"use client";

import { useState, useTransition } from "react";

import { TRANSFER_FILE_FIELD_NAME } from "@/features/transfer/model/transfer.constants";
import type { TransferUploadResponse } from "@/features/transfer/model/transfer.types";

type UploadState = {
	error: string | null;
	result: (TransferUploadResponse & { shareUrl: string }) | null;
	isPending: boolean;
	isCopied: boolean;
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	handleCopyLink: () => Promise<void>;
};

export const useTransferUploadViewModel = (): UploadState => {
	const [result, setResult] = useState<
		(TransferUploadResponse & { shareUrl: string }) | null
	>(null);
	const [error, setError] = useState<string | null>(null);
	const [isCopied, setIsCopied] = useState(false);
	const [isPending, startTransition] = useTransition();

	const submitUpload = async (formData: FormData) => {
		setError(null);
		setIsCopied(false);

		const response = await fetch("/api/transfer/upload", {
			method: "POST",
			body: formData,
		});

		const payload = (await response.json().catch(() => null)) as
			| TransferUploadResponse
			| { error?: string }
			| null;

		if (!response.ok) {
			setResult(null);
			const errorMessage =
				payload && "error" in payload ? payload.error : undefined;
			setError(errorMessage ?? "Upload failed. Please try again.");
			return;
		}

		if (!payload || !("sharePath" in payload)) {
			setResult(null);
			setError("Upload succeeded, but no share link was returned.");
			return;
		}

		setResult({
			...payload,
			shareUrl: new URL(payload.sharePath, window.location.origin).toString(),
		});
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		if (!(formData.get(TRANSFER_FILE_FIELD_NAME) instanceof File)) {
			setError("Choose one file before uploading.");
			setResult(null);
			return;
		}

		startTransition(() => {
			void submitUpload(formData);
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
			setError("Copy failed. You can still copy the link manually.");
		}
	};

	return {
		error,
		result,
		isPending,
		isCopied,
		handleSubmit,
		handleCopyLink,
	};
};
