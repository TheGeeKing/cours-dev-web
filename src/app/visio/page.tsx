import { redirect } from "next/navigation";

import { VisioCreateRoomForm } from "@/features/visio/view/visio-create-room-form";
import { getSession } from "@/server/better-auth/server";
import { PageContainer, PageShell, Panel, SectionHeader } from "@/shared/ui";

export default async function VisioPage() {
	const session = await getSession();

	if (!session?.user) {
		redirect("/");
	}

	return (
		<PageShell>
			<PageContainer>
				<Panel className="py-4">
					<SectionHeader
						description={
							<>
								Hébergement en tant que{" "}
								{session.user.name ?? session.user.email}. Créez un salon,
								copiez le lien d'accès, puis ouvrez la page du salon pour gérer
								les accès et les contrôles d'appel.
							</>
						}
						eyebrow="Connecté"
						title="Espace de salon vidéo"
					/>
				</Panel>

				<VisioCreateRoomForm
					defaultDisplayName={session.user.name ?? session.user.email ?? "Hôte"}
				/>
			</PageContainer>
		</PageShell>
	);
}
