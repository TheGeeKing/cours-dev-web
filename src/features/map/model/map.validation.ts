import { z } from "zod";

import type { MapFacetName, MapFilters } from "./map.types";

const MAX_MAP_POINT_LIMIT = 500;

const optionalFilterSchema = z
	.string()
	.trim()
	.min(1)
	.max(120)
	.optional()
	.catch(undefined);

const mapFiltersSchema = z.object({
	region: optionalFilterSchema,
	department: optionalFilterSchema,
	category: optionalFilterSchema,
	search: optionalFilterSchema,
	limit: z.coerce
		.number()
		.int()
		.min(1)
		.max(MAX_MAP_POINT_LIMIT)
		.optional()
		.catch(undefined),
});

const mapFacetNameSchema = z.enum(["region", "departement", "categorie"]);

export function parseMapFilters(searchParams: URLSearchParams): MapFilters {
	const filters = mapFiltersSchema.parse({
		region: searchParams.get("region") ?? undefined,
		department: searchParams.get("department") ?? undefined,
		category: searchParams.get("category") ?? undefined,
		search: searchParams.get("search") ?? undefined,
		limit: searchParams.get("limit") ?? undefined,
	});

	return filters;
}

export function parseMapFacetName(searchParams: URLSearchParams): MapFacetName {
	return mapFacetNameSchema.parse(searchParams.get("facet") ?? "region");
}
