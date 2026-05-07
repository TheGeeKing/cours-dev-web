import { isVisioError } from "./visio.errors";

export const createVisioErrorResponse = (
	error: unknown,
	fallbackMessage: string,
	logLabel: string,
) => {
	if (isVisioError(error)) {
		return Response.json(
			{
				error: error.message,
				code: error.code,
			},
			{ status: error.statusCode },
		);
	}

	console.error(logLabel, error);
	return Response.json({ error: fallbackMessage }, { status: 500 });
};
