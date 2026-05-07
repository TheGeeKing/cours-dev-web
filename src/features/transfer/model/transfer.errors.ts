export class TransferError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
		public readonly code:
			| "BAD_REQUEST"
			| "NOT_FOUND"
			| "EXPIRED"
			| "UNAUTHORIZED"
			| "INTERNAL_ERROR",
	) {
		super(message);
		this.name = "TransferError";
	}
}

export const isTransferError = (error: unknown): error is TransferError =>
	error instanceof TransferError ||
	(!!error &&
		typeof error === "object" &&
		"name" in error &&
		"statusCode" in error &&
		"code" in error &&
		error.name === "TransferError");
