import { redirect } from "next/navigation";

import { TransferUploadForm } from "@/features/transfer/view/transfer-upload-form";
import { getSession } from "@/server/better-auth/server";
import { PageContainer, PageShell, Panel, SectionHeader } from "@/shared/ui";

export default async function TransferPage() {
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
								Envoi en tant que {session.user.name ?? session.user.email}. Les
								liens restent publics, mais l'envoi reste limité aux
								utilisateurs authentifiés.
							</>
						}
						eyebrow="Connecté"
						title="Espace de transfert de fichiers"
					/>
				</Panel>

				<TransferUploadForm />
			</PageContainer>
		</PageShell>
	);
}
