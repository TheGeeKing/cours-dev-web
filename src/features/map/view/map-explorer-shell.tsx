"use client";

import dynamic from "next/dynamic";

import { MapFiltersPanel } from "@/features/map/view/map-filters-panel";
import { useMapExplorerViewModel } from "@/features/map/view-model/use-map-explorer-view-model";
import { Button, Panel, SectionHeader } from "@/shared/ui";

const MapCanvas = dynamic(
	() =>
		import("@/features/map/view/map-canvas").then((module) => module.MapCanvas),
	{
		loading: () => (
			<div className="flex min-h-[32rem] items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 text-sm">
				Chargement de la carte...
			</div>
		),
		ssr: false,
	},
);

export function MapExplorerShell() {
	const viewModel = useMapExplorerViewModel();

	return (
		<div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
			<MapFiltersPanel
				displayedCountLabel={viewModel.displayedCountLabel}
				facets={viewModel.facets}
				filters={viewModel.filters}
				isLoading={viewModel.isLoading}
				isLoadingFacets={viewModel.isLoadingFacets}
				onReset={viewModel.resetFilters}
				onUpdateSearchFilter={viewModel.updateSearchFilter}
				onUpdateSelectFilter={viewModel.updateSelectFilter}
			/>

			<Panel className="space-y-5">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<SectionHeader
						description="Chaque marqueur correspond à un musée géolocalisé dans la base Muséofile."
						eyebrow="Open data"
						title="Carte des musées de France"
						titleAs="h1"
					/>
					<a
						className="font-medium text-slate-600 text-sm underline-offset-4 hover:text-slate-950 hover:underline"
						href="https://www.data.gouv.fr/fr/datasets/base-museofile-des-musees-de-france/"
						rel="noreferrer"
						target="_blank"
					>
						Source data.gouv.fr
					</a>
				</div>

				{viewModel.error ? (
					<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm leading-6">
						<p>{viewModel.error}</p>
						<Button onClick={viewModel.retry} type="button" variant="danger">
							Réessayer
						</Button>
					</div>
				) : null}

				<div className="relative">
					<MapCanvas points={viewModel.points} />

					{viewModel.isLoading ? (
						<div className="pointer-events-none absolute top-3 right-3 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-slate-700 text-sm shadow-sm backdrop-blur-sm">
							Chargement des musées...
						</div>
					) : null}
				</div>

				{!viewModel.isLoading &&
				!viewModel.error &&
				viewModel.points.length === 0 ? (
					<div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 text-sm">
						Aucun musée ne correspond aux filtres sélectionnés.
					</div>
				) : null}
			</Panel>
		</div>
	);
}
