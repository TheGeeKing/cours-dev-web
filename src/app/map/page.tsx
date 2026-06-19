import { MapExplorerShell } from "@/features/map/view/map-explorer-shell";
import { PageContainer, PageShell } from "@/shared/ui";

export default function MapPage() {
	return (
		<PageShell>
			<PageContainer size="wide">
				<MapExplorerShell />
			</PageContainer>
		</PageShell>
	);
}
