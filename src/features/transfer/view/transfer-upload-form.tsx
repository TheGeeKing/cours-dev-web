"use client";

import { useTransferUploadViewModel } from "@/features/transfer/view-model/use-transfer-upload-view-model";
import {
	Alert,
	Button,
	DataList,
	Field,
	FormPanel,
	InfoItem,
	Input,
	Panel,
	SectionHeader,
} from "@/shared/ui";

const formatBytes = (bytes: number) =>
	new Intl.NumberFormat("fr-FR", {
		maximumFractionDigits: 1,
		notation: bytes >= 1024 * 1024 ? "compact" : "standard",
	}).format(bytes);

const formatDate = (value: string) =>
	new Intl.DateTimeFormat("fr-FR", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));

export function TransferUploadForm() {
	const viewModel = useTransferUploadViewModel();

	return (
		<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<FormPanel onSubmit={viewModel.handleSubmit}>
				<SectionHeader
					description={
						<>
							Envoyez un fichier jusqu'à 100 Mo. Nous le stockons localement,
							créons un lien impossible à deviner, puis le supprimons
							automatiquement après 7 jours.
						</>
					}
					eyebrow="Envoi"
					title="Créer un lien de partage privé."
					titleAs="h1"
				/>

				<Field className="mt-6" htmlFor="transfer-file" label="Fichier">
					<Input id="transfer-file" name="file" type="file" />
				</Field>

				{viewModel.error ? (
					<Alert className="mt-4" variant="danger">
						{viewModel.error}
					</Alert>
				) : null}

				<Button className="mt-6" disabled={viewModel.isPending} type="submit">
					{viewModel.isPending
						? "Envoi en cours..."
						: "Envoyer et créer le lien"}
				</Button>
			</FormPanel>

			<Panel tone="dark">
				{viewModel.result ? (
					<div className="mt-4 space-y-4">
						<SectionHeader
							description={
								<>
									Ce lien reste actif jusqu'au{" "}
									{formatDate(viewModel.result.expiresAt)}.
								</>
							}
							eyebrow="Partage"
							inverted
							title={viewModel.result.originalFilename}
						/>
						<DataList className="sm:grid-cols-1">
							<InfoItem
								inverted
								label="Type MIME"
								value={viewModel.result.mimeType}
							/>
							<InfoItem
								inverted
								label="Taille"
								value={`${formatBytes(viewModel.result.sizeBytes)} octets`}
							/>
							<InfoItem
								className="sm:col-span-1"
								inverted
								label="Lien"
								value={
									<span className="break-all text-sky-200">
										{viewModel.result.shareUrl}
									</span>
								}
							/>
						</DataList>
						<Button
							className="bg-white text-slate-900 hover:bg-slate-100"
							onClick={() => {
								void viewModel.handleCopyLink();
							}}
							type="button"
						>
							{viewModel.isCopied ? "Lien copié" : "Copier le lien de partage"}
						</Button>
					</div>
				) : (
					<SectionHeader
						description="Votre lien partageable apparaîtra ici juste après l'envoi."
						eyebrow="Partage"
						inverted
						title="Aucun lien créé pour le moment"
					/>
				)}
			</Panel>
		</div>
	);
}
