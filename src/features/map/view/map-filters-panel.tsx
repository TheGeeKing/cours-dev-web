import type {
  MapFacetState,
  MapFilterForm,
} from "@/features/map/view-model/use-map-explorer-view-model";
import {
  Badge,
  Button,
  Field,
  FormPanel,
  Input,
  SectionHeader,
  Select,
} from "@/shared/ui";

type MapFiltersPanelProps = {
  displayedCountLabel: string;
  facets: MapFacetState;
  filters: MapFilterForm;
  isLoading: boolean;
  isLoadingFacets: boolean;
  onReset: () => void;
  onUpdateSearchFilter: (value: string) => void;
  onUpdateSelectFilter: (
    filterName: "category" | "department" | "region",
    value: string,
  ) => void;
};

export function MapFiltersPanel(props: MapFiltersPanelProps) {
  return (
    <FormPanel className="h-fit">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          description="Les filtres se mettent à jour automatiquement."
          eyebrow="Filtres"
          title="Explorer les points"
        />
        <Badge variant="info">{props.displayedCountLabel}</Badge>
      </div>

      <div className="mt-6 space-y-4">
        <Field htmlFor="map-region" label="Région">
          <Select
            disabled={props.isLoadingFacets}
            id="map-region"
            onChange={(event) =>
              props.onUpdateSelectFilter("region", event.target.value)
            }
            value={props.filters.region}
          >
            <option value="">Toutes les régions</option>
            {props.facets.regions.map((facet) => (
              <option key={facet.label} value={facet.label}>
                {facet.label} ({facet.count})
              </option>
            ))}
          </Select>
        </Field>

        <Field htmlFor="map-department" label="Département">
          <Select
            disabled={props.isLoadingFacets}
            id="map-department"
            onChange={(event) =>
              props.onUpdateSelectFilter("department", event.target.value)
            }
            value={props.filters.department}
          >
            <option value="">Tous les départements</option>
            {props.facets.departments.map((facet) => (
              <option key={facet.label} value={facet.label}>
                {facet.label} ({facet.count})
              </option>
            ))}
          </Select>
        </Field>

        <Field htmlFor="map-category" label="Catégorie">
          <Select
            disabled={props.isLoadingFacets}
            id="map-category"
            onChange={(event) =>
              props.onUpdateSelectFilter("category", event.target.value)
            }
            value={props.filters.category}
          >
            <option value="">Toutes les catégories</option>
            {props.facets.categories.map((facet) => (
              <option key={facet.label} value={facet.label}>
                {facet.label} ({facet.count})
              </option>
            ))}
          </Select>
        </Field>

        <Field
          help="Recherche dans le nom officiel du musée."
          htmlFor="map-search"
          label="Recherche"
        >
          <Input
            id="map-search"
            onChange={(event) => props.onUpdateSearchFilter(event.target.value)}
            placeholder="Ex. poterie, archéologie, beaux-arts..."
            type="search"
            value={props.filters.search}
          />
        </Field>
      </div>

      <div className="mt-6">
        <Button
          className="w-full"
          disabled={props.isLoading}
          onClick={props.onReset}
          type="button"
          variant="secondary"
        >
          Réinitialiser
        </Button>
      </div>
    </FormPanel>
  );
}
