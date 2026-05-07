import type { TransferShareState } from "@/features/transfer/model/transfer.types";
import {
	buttonClasses,
	DataList,
	InfoItem,
	PageContainer,
	PageShell,
	Panel,
	SectionHeader,
} from "@/shared/ui";

const formatBytes = (bytes: number) =>
	new Intl.NumberFormat("fr-FR", {
		maximumFractionDigits: 1,
		notation: bytes >= 1024 * 1024 ? "compact" : "standard",
	}).format(bytes);

const formatDate = (value: Date) =>
	new Intl.DateTimeFormat("fr-FR", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(value);

export function TransferShareShell(props: { state: TransferShareState }) {
	return (
		<PageShell>
			<PageContainer size="narrow">
				<Panel>
					{props.state.status === "ready" ? (
						<div className="space-y-6">
							<SectionHeader
								description={
									<>
										Ce fichier est disponible jusqu'au{" "}
										{formatDate(props.state.transfer.expiresAt)}.
									</>
								}
								eyebrow="Transfert"
								title={props.state.transfer.originalFilename}
								titleAs="h1"
							/>

							<DataList>
								<InfoItem
									label="Type MIME"
									value={props.state.transfer.mimeType}
								/>
								<InfoItem
									label="Taille"
									value={`${formatBytes(props.state.transfer.sizeBytes)} octets`}
								/>
								<InfoItem
									label="Créé le"
									value={formatDate(props.state.transfer.createdAt)}
								/>
								<InfoItem
									label="Expire le"
									value={formatDate(props.state.transfer.expiresAt)}
								/>
							</DataList>

							<a
								className={buttonClasses()}
								href={props.state.transfer.downloadPath}
							>
								Télécharger le fichier
							</a>
						</div>
					) : props.state.status === "expired" ? (
						<SectionHeader
							description={
								<>
									{props.state.originalFilename} a été supprimé le{" "}
									{formatDate(props.state.expiredAt)} dans le cadre de la
									fenêtre de nettoyage de 7 jours.
								</>
							}
							eyebrow="Expiré"
							title="Ce lien de transfert a expiré."
							titleAs="h1"
						/>
					) : (
						<SectionHeader
							description="Le lien est peut-être invalide, déjà nettoyé, ou son fichier est manquant."
							eyebrow="Introuvable"
							title="Ce lien de transfert n'existe pas."
							titleAs="h1"
						/>
					)}
				</Panel>
			</PageContainer>
		</PageShell>
	);
}
