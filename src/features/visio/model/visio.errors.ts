export class VisioError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number,
		public readonly code:
			| "BAD_REQUEST"
			| "NOT_FOUND"
			| "UNAUTHORIZED"
			| "FORBIDDEN"
			| "CONFLICT"
			| "EXPIRED"
			| "INTERNAL_ERROR",
	) {
		super(message);
		this.name = "VisioError";
	}
}

export const isVisioError = (error: unknown): error is VisioError =>
	error instanceof VisioError ||
	(!!error &&
		typeof error === "object" &&
		"name" in error &&
		"statusCode" in error &&
		"code" in error &&
		error.name === "VisioError");
