"use client";

import Link from "next/link";

import { useVisioCreateRoomViewModel } from "@/features/visio/view-model/use-visio-create-room-view-model";
import {
	Alert,
	Button,
	buttonClasses,
	CheckboxRow,
	DataList,
	Field,
	FormPanel,
	InfoItem,
	Input,
	Panel,
	SectionHeader,
} from "@/shared/ui";

const formatDate = (value: string) =>
	new Intl.DateTimeFormat("fr-FR", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(new Date(value));

export function VisioCreateRoomForm(props: { defaultDisplayName: string }) {
	const viewModel = useVisioCreateRoomViewModel();

	return (
		<div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
			<FormPanel onSubmit={viewModel.handleSubmit}>
				<SectionHeader
					description={
						<>
							Définissez votre nom d'affichage, choisissez les conditions
							d'accès du salon et créez un lien de partage pour l'invité.
						</>
					}
					eyebrow="Espace hôte"
					title="Créer un salon vidéo individuel."
					titleAs="h1"
				/>

				<Field
					className="mt-6"
					htmlFor="visio-host-display-name"
					label="Nom d'affichage de l'hôte"
				>
					<Input
						defaultValue={props.defaultDisplayName}
						id="visio-host-display-name"
						name="hostDisplayName"
						required
						type="text"
					/>
				</Field>

				<div className="mt-6 space-y-3">
					<CheckboxRow name="requireJoinAuth">
						<span className="block font-medium text-slate-900">
							Exiger la connexion des invités
						</span>
						<span className="mt-1 block text-slate-600">
							Toute personne ayant le lien peut toujours ouvrir la page du
							salon, mais rejoindre l'appel demandera une authentification
							GitHub.
						</span>
					</CheckboxRow>

					<CheckboxRow name="requireWaitingRoom">
						<span className="block font-medium text-slate-900">
							Activer une salle d'attente
						</span>
						<span className="mt-1 block text-slate-600">
							Les invités restent en attente jusqu'à votre approbation depuis la
							page du salon.
						</span>
					</CheckboxRow>
				</div>

				{viewModel.error ? (
					<Alert className="mt-4" variant="danger">
						{viewModel.error}
					</Alert>
				) : null}

				<Button className="mt-6" disabled={viewModel.isPending} type="submit">
					{viewModel.isPending ? "Création du salon..." : "Créer le salon"}
				</Button>
			</FormPanel>

			<Panel tone="dark">
				{viewModel.result ? (
					<div className="mt-4 space-y-4">
						<SectionHeader
							description={
								<>
									Le salon reste disponible jusqu'au{" "}
									{formatDate(viewModel.result.expiresAt)} sauf si vous y mettez
									fin avant.
								</>
							}
							eyebrow="Partage"
							inverted
							title={`Salon prêt pour ${viewModel.result.hostDisplayName}`}
						/>
						<DataList className="sm:grid-cols-1">
							<InfoItem
								inverted
								label="Accès invité"
								value={
									viewModel.result.settings.requireJoinAuth
										? "Invités connectés uniquement"
										: "Toute personne avec le lien peut rejoindre"
								}
							/>
							<InfoItem
								inverted
								label="Admission"
								value={
									viewModel.result.settings.requireWaitingRoom
										? "Approbation manuelle par l'hôte"
										: "Entrée immédiate"
								}
							/>
							<InfoItem
								inverted
								label="Lien du salon"
								value={
									<span className="break-all text-sky-200">
										{viewModel.result.shareUrl}
									</span>
								}
							/>
						</DataList>
						<div className="flex flex-wrap gap-3">
							<Button
								onClick={() => {
									void viewModel.handleCopyLink();
								}}
								type="button"
								variant="secondary"
							>
								{viewModel.isCopied ? "Lien copié" : "Copier le lien du salon"}
							</Button>
							<Link
								className={buttonClasses(
									"secondary",
									"border-slate-700 bg-slate-900 text-white hover:border-slate-500 hover:bg-slate-800",
								)}
								href={viewModel.result.sharePath}
							>
								Ouvrir le salon
							</Link>
						</div>
					</div>
				) : (
					<SectionHeader
						description="Le lien invité et le résumé du salon apparaîtront ici dès la création du salon."
						eyebrow="Partage"
						inverted
						title="Aucun salon créé pour le moment"
					/>
				)}
			</Panel>
		</div>
	);
}
