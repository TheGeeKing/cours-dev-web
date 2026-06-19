// @vitest-environment node

import { describe, expect, it } from "vitest";

import { buildMuseumWhereClause, normalizeMuseumRecord } from "./map.service";

describe("map.service", () => {
	it("builds an OpenDataSoft where clause from selected filters", () => {
		const where = buildMuseumWhereClause({
			region: "Grand Est",
			department: "Bas-Rhin",
			category: "musée en milieu rural",
			search: "poterie",
		});

		expect(where).toBe(
			'region = "Grand Est" AND departement = "Bas-Rhin" AND categorie = "musée en milieu rural" AND search(nom_officiel, "poterie")',
		);
	});

	it("can exclude the currently requested facet from the where clause", () => {
		const where = buildMuseumWhereClause(
			{
				region: "Grand Est",
				department: "Bas-Rhin",
				category: "musée en milieu rural",
				search: "poterie",
			},
			{ exclude: "department" },
		);

		expect(where).not.toContain("departement");
		expect(where).toContain('region = "Grand Est"');
		expect(where).toContain('categorie = "musée en milieu rural"');
	});

	it("normalizes a museum record with coordinates", () => {
		const point = normalizeMuseumRecord({
			identifiant: "M0002",
			nom_officiel: "musée de La Poterie",
			ville: "Betschdorf",
			region: "Grand Est",
			departement: "Bas-Rhin",
			categorie: "musée en milieu rural",
			url: "www.betschdorf.com/musee",
			coordonnees: { lat: 48.900348, lon: 7.914409 },
		});

		expect(point).toEqual({
			id: "M0002",
			name: "musée de La Poterie",
			lat: 48.900348,
			lng: 7.914409,
			city: "Betschdorf",
			region: "Grand Est",
			department: "Bas-Rhin",
			category: "musée en milieu rural",
			url: "https://www.betschdorf.com/musee",
		});
	});

	it("skips records without valid coordinates", () => {
		expect(
			normalizeMuseumRecord({
				identifiant: "M0002",
				nom_officiel: "musée de La Poterie",
				coordonnees: null,
			}),
		).toBeNull();
	});
});
