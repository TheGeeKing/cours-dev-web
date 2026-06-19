import { fetchMuseumFacets } from "@/features/map/model/map.service";
import {
	parseMapFacetName,
	parseMapFilters,
} from "@/features/map/model/map.validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
	try {
		const searchParams = new URL(request.url).searchParams;
		const facet = parseMapFacetName(searchParams);
		const filters = parseMapFilters(searchParams);
		const facets = await fetchMuseumFacets(facet, filters);

		return Response.json({ facets });
	} catch (error) {
		console.error("map facets fetch failed", error);
		return Response.json(
			{
				error:
					"Les filtres des musées n'ont pas pu être chargés pour le moment.",
			},
			{ status: 500 },
		);
	}
}
