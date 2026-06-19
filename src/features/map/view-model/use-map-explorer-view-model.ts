"use client";

import { useDebouncedValue } from "@tanstack/react-pacer";
import { useCallback, useEffect, useMemo, useState } from "react";

import type {
	MapFacetName,
	MapFacetState,
	MapFacetsResponse,
	MapFilterForm,
	MapFilters,
	MapPoint,
	MapPointsResponse,
} from "@/features/map/model/map.types";

const emptyFilterForm: MapFilterForm = {
	region: "",
	department: "",
	category: "",
	search: "",
};

const initialFacetState: MapFacetState = {
	regions: [],
	departments: [],
	categories: [],
};

const SEARCH_DEBOUNCE_MS = 400;

const facetRequests: Array<{
	facet: MapFacetName;
	stateKey: keyof MapFacetState;
}> = [
	{ facet: "region", stateKey: "regions" },
	{ facet: "departement", stateKey: "departments" },
	{ facet: "categorie", stateKey: "categories" },
];

export function useMapExplorerViewModel() {
	const [filters, setFilters] = useState<MapFilterForm>(emptyFilterForm);
	const [debouncedSearch] = useDebouncedValue(filters.search, {
		wait: SEARCH_DEBOUNCE_MS,
	});
	const [facets, setFacets] = useState<MapFacetState>(initialFacetState);
	const [points, setPoints] = useState<MapPoint[]>([]);
	const [totalCount, setTotalCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingFacets, setIsLoadingFacets] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const queryFilters = useMemo(
		(): MapFilterForm => ({
			region: filters.region,
			department: filters.department,
			category: filters.category,
			search: debouncedSearch,
		}),
		[filters.category, filters.department, filters.region, debouncedSearch],
	);

	const displayedCountLabel = useMemo(() => {
		if (totalCount <= points.length) {
			return `${points.length} musée${points.length > 1 ? "s" : ""} affiché${points.length > 1 ? "s" : ""}`;
		}

		return `${points.length} musée${points.length > 1 ? "s" : ""} affiché${points.length > 1 ? "s" : ""} sur ${totalCount}`;
	}, [points.length, totalCount]);

	const loadPoints = useCallback(async (nextFilters: MapFilterForm) => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/map/museums?${buildQuery(nextFilters)}`,
			);

			if (!response.ok) {
				throw new Error("Map API failed.");
			}

			const payload = (await response.json()) as MapPointsResponse;
			setPoints(payload.points);
			setTotalCount(payload.totalCount);
		} catch {
			setError(
				"Les musées n'ont pas pu être chargés. Vérifiez votre connexion puis réessayez.",
			);
			setPoints([]);
			setTotalCount(0);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const loadFacets = useCallback(async (nextFilters: MapFilterForm) => {
		setIsLoadingFacets(true);

		try {
			const entries = await Promise.all(
				facetRequests.map(async ({ facet, stateKey }) => {
					const response = await fetch(
						`/api/map/facets?facet=${facet}&${buildQuery(nextFilters)}`,
					);

					if (!response.ok) {
						throw new Error("Facet API failed.");
					}

					const payload = (await response.json()) as MapFacetsResponse;
					return [stateKey, payload.facets] as const;
				}),
			);

			setFacets(Object.fromEntries(entries) as MapFacetState);
		} catch {
			setFacets(initialFacetState);
		} finally {
			setIsLoadingFacets(false);
		}
	}, []);

	useEffect(() => {
		void loadPoints(queryFilters);
		void loadFacets(queryFilters);
	}, [loadFacets, loadPoints, queryFilters]);

	const updateSelectFilter = useCallback(
		(filterName: "category" | "department" | "region", value: string) => {
			setFilters((currentFilters) => {
				if (filterName === "region") {
					return {
						...currentFilters,
						region: value,
						department: "",
					};
				}

				return {
					...currentFilters,
					[filterName]: value,
				};
			});
		},
		[],
	);

	const updateSearchFilter = useCallback((value: string) => {
		setFilters((currentFilters) => ({
			...currentFilters,
			search: value,
		}));
	}, []);

	const resetFilters = useCallback(() => {
		setFilters(emptyFilterForm);
	}, []);

	const retry = useCallback(() => {
		void loadPoints(queryFilters);
		void loadFacets(queryFilters);
	}, [loadFacets, loadPoints, queryFilters]);

	return {
		displayedCountLabel,
		error,
		facets,
		filters,
		isLoading,
		isLoadingFacets,
		points,
		resetFilters,
		retry,
		totalCount,
		updateSearchFilter,
		updateSelectFilter,
	};
}

function buildQuery(filters: MapFilterForm) {
	const searchParams = new URLSearchParams();
	const normalizedFilters = normalizeFilters(filters);

	for (const [key, value] of Object.entries(normalizedFilters)) {
		if (value) {
			searchParams.set(key, value);
		}
	}

	return searchParams.toString();
}

function normalizeFilters(filters: MapFilterForm): Omit<MapFilters, "limit"> {
	return {
		...(filters.region.trim() ? { region: filters.region.trim() } : {}),
		...(filters.department.trim()
			? { department: filters.department.trim() }
			: {}),
		...(filters.category.trim() ? { category: filters.category.trim() } : {}),
		...(filters.search.trim() ? { search: filters.search.trim() } : {}),
	};
}
