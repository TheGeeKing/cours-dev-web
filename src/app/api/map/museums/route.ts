import { fetchMuseumPoints } from "@/features/map/model/map.service";
import { parseMapFilters } from "@/features/map/model/map.validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
	try {
		const filters = parseMapFilters(new URL(request.url).searchParams);
		const response = await fetchMuseumPoints(filters);

		return Response.json(response);
	} catch (error) {
		console.error("map museums fetch failed", error);
		return Response.json(
			{
				error:
					"Les données des musées n'ont pas pu être chargées pour le moment.",
			},
			{ status: 500 },
		);
	}
}
