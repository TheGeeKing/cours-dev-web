import type {
	MapFacet,
	MapFacetName,
	MapFilters,
	MapPoint,
	MapPointsResponse,
} from "./map.types";

const MUSEUM_DATASET_API_URL =
	"https://data.culture.gouv.fr/api/explore/v2.1/catalog/datasets/musees-de-france-base-museofile";
const MUSEUM_PAGE_SIZE = 100;

type MuseumFilterKey = Exclude<keyof MapFilters, "limit" | "search">;

type MuseumRecord = {
	identifiant?: unknown;
	nom_officiel?: unknown;
	ville?: unknown;
	region?: unknown;
	departement?: unknown;
	categorie?: unknown;
	url?: unknown;
	coordonnees?: unknown;
};

type MuseumFacetPayload = {
	facets?: Array<{
		name?: string;
		facets?: Array<{
			name?: string;
			count?: number;
			value?: string;
		}>;
	}>;
};

type MuseumRecordsPayload = {
	total_count?: number;
	results?: MuseumRecord[];
};

const filterFields: Record<MuseumFilterKey, string> = {
	region: "region",
	department: "departement",
	category: "categorie",
};

const filterKeysByFacet: Record<MapFacetName, MuseumFilterKey> = {
	region: "region",
	departement: "department",
	categorie: "category",
};

export async function fetchMuseumPoints(
	filters: MapFilters,
): Promise<MapPointsResponse> {
	const where = buildMuseumWhereClause(filters);
	const firstPage = await fetchMuseumRecordsPage(0, MUSEUM_PAGE_SIZE, where);
	const totalCount = firstPage.total_count ?? 0;
	const allRecords = [...(firstPage.results ?? [])];

	if (!filters.limit && totalCount > MUSEUM_PAGE_SIZE) {
		const pageCount = Math.ceil(totalCount / MUSEUM_PAGE_SIZE);
		const remainingPages = await Promise.all(
			Array.from({ length: pageCount - 1 }, (_, index) =>
				fetchMuseumRecordsPage(
					(index + 1) * MUSEUM_PAGE_SIZE,
					MUSEUM_PAGE_SIZE,
					where,
				),
			),
		);

		for (const page of remainingPages) {
			allRecords.push(...(page.results ?? []));
		}
	}

	const points = allRecords
		.map(normalizeMuseumRecord)
		.filter((point): point is MapPoint => point !== null);

	return {
		points: filters.limit ? points.slice(0, filters.limit) : points,
		totalCount: totalCount || points.length,
	};
}

async function fetchMuseumRecordsPage(
	offset: number,
	limit: number,
	where: string,
) {
	const requestUrl = new URL(`${MUSEUM_DATASET_API_URL}/records`);
	requestUrl.searchParams.set("limit", String(limit));
	requestUrl.searchParams.set("offset", String(offset));

	if (where) {
		requestUrl.searchParams.set("where", where);
	}

	const response = await fetch(requestUrl, { next: { revalidate: 60 * 60 } });

	if (!response.ok) {
		throw new Error("Unable to fetch museum data.");
	}

	return (await response.json()) as MuseumRecordsPayload;
}

export async function fetchMuseumFacets(
	facet: MapFacetName,
	filters: MapFilters,
): Promise<MapFacet[]> {
	const requestUrl = new URL(`${MUSEUM_DATASET_API_URL}/facets`);
	requestUrl.searchParams.set("facet", facet);

	const where = buildMuseumWhereClause(filters, {
		exclude: filterKeysByFacet[facet],
	});

	if (where) {
		requestUrl.searchParams.set("where", where);
	}

	const response = await fetch(requestUrl, { next: { revalidate: 60 * 60 } });

	if (!response.ok) {
		throw new Error("Unable to fetch museum facets.");
	}

	const payload = (await response.json()) as MuseumFacetPayload;
	const facetGroup = payload.facets?.find((item) => item.name === facet);

	return (facetGroup?.facets ?? [])
		.map((item) => ({
			label: item.value ?? item.name ?? "",
			count: item.count ?? 0,
		}))
		.filter((item) => item.label.length > 0)
		.sort((left, right) => left.label.localeCompare(right.label, "fr"));
}

export function buildMuseumWhereClause(
	filters: Pick<MapFilters, "category" | "department" | "region" | "search">,
	options: { exclude?: MuseumFilterKey } = {},
) {
	const clauses = (
		Object.entries(filterFields) as Array<[MuseumFilterKey, string]>
	).flatMap(([filterKey, field]) => {
		if (filterKey === options.exclude) {
			return [];
		}

		const value = filters[filterKey];
		return value ? [`${field} = "${escapeOdsValue(value)}"`] : [];
	});

	if (filters.search) {
		clauses.push(`search(nom_officiel, "${escapeOdsValue(filters.search)}")`);
	}

	return clauses.join(" AND ");
}

export function normalizeMuseumRecord(record: MuseumRecord): MapPoint | null {
	const id = getStringValue(record.identifiant);
	const name = getStringValue(record.nom_officiel);
	const coordinates = getCoordinates(record.coordonnees);

	if (!id || !name || !coordinates) {
		return null;
	}

	const url = getMuseumUrl(record.url);

	return {
		id,
		name,
		lat: coordinates.lat,
		lng: coordinates.lng,
		city: getStringValue(record.ville) ?? "Ville inconnue",
		region: getStringValue(record.region) ?? "Région inconnue",
		department: getStringValue(record.departement) ?? "Département inconnu",
		category: getStringValue(record.categorie) ?? "Catégorie non renseignée",
		...(url ? { url } : {}),
	};
}

function getCoordinates(value: unknown) {
	if (
		typeof value !== "object" ||
		value === null ||
		!("lat" in value) ||
		!("lon" in value)
	) {
		return null;
	}

	const lat = Number(value.lat);
	const lng = Number(value.lon);

	if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
		return null;
	}

	return { lat, lng };
}

function getMuseumUrl(value: unknown) {
	const rawValue = getStringValue(value);

	if (!rawValue) {
		return undefined;
	}

	const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(rawValue)
		? rawValue
		: `https://${rawValue}`;

	try {
		const url = new URL(withProtocol);
		return url.protocol === "http:" || url.protocol === "https:"
			? url.toString()
			: undefined;
	} catch {
		return undefined;
	}
}

function getStringValue(value: unknown) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: undefined;
}

function escapeOdsValue(value: string) {
	return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
