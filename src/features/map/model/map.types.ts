export type MapFacetName = "region" | "departement" | "categorie";

export type MapFilters = {
	region?: string;
	department?: string;
	category?: string;
	search?: string;
	limit?: number;
};

export type MapPoint = {
	id: string;
	name: string;
	lat: number;
	lng: number;
	city: string;
	region: string;
	department: string;
	category: string;
	url?: string;
};

export type MapFacet = {
	label: string;
	count: number;
};

export type MapPointsResponse = {
	points: MapPoint[];
	totalCount: number;
};

export type MapFacetsResponse = {
	facets: MapFacet[];
};
