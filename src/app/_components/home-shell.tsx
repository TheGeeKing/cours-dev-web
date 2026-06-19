import Link from "next/link";
import type { ReactNode } from "react";

import {
	Badge,
	buttonClasses,
	PageContainer,
	PageShell,
	Panel,
	SectionHeader,
} from "@/shared/ui";

type HomeShellProps = {
	sessionLabel: string;
	sessionDescription: string;
	authAction: ReactNode;
	isSignedIn: boolean;
};

const coreMilestones = [
	"Transfert de médias",
	"Visio",
	"Intégration cartographique",
];

const requiredLaterModules = [
	"Profil du compte et adresse enregistrée",
	"Grille catalogue et détails produit",
	"Panier, paiement et historique des commandes",
];

const routeCatalog = [
	{
		href: "/",
		title: "Accueil",
		path: "/",
		description: "La page d'accueil, rien de fou",
		availability: "Public",
	},
	{
		href: "/transfer",
		title: "Transfert",
		path: "/transfer",
		description:
			"Permet l'upload et le partage de fichiers via la génération d'un lien",
		availability: "Connecté",
	},
	{
		href: "/transfer",
		title: "Modèle de page de partage",
		path: "/transfer/[slug]",
		description: "La page à laquelle on accède avec un lien de partage",
		availability: "Public après envoi",
	},
	{
		href: "/visio",
		title: "Visio",
		path: "/visio",
		description: "Page pour créer une visio",
		availability: "Connecté",
	},
	{
		href: "/visio",
		title: "Modèle de salon",
		path: "/visio/[slug]",
		description:
			"La page pour rejoindre, patienter et participer à une visio dont on a le lien",
		availability: "Public après création du salon",
	},
	{
		href: "/map",
		title: "Carte",
		path: "/map",
		description: "Carte interactive des musées de France (open data)",
		availability: "Public",
	},
];

export function HomeShell(props: HomeShellProps) {
	return (
		<PageShell>
			<PageContainer className="gap-6">
				<Panel className="overflow-hidden p-0">
					<div className="grid gap-6 p-6 lg:grid-cols-[1.45fr_0.9fr] lg:p-8">
						<div className="space-y-6">
							<SectionHeader
								description={
									<>
										Projet réalisé aucours du cours application web visant à
										mettre en pratique l'architecture MVVM
									</>
								}
								title="Projet Cours Application Web"
								titleAs="h1"
							/>
							<div className="flex flex-wrap gap-3">
								<Badge variant="success">Architecture MVVM</Badge>
								<Badge variant="info">Authentification avec GitHub</Badge>
							</div>
						</div>

						<Panel className="shadow-none" tone="dark">
							<SectionHeader
								description={props.sessionDescription}
								// eyebrow="Session"
								inverted
								title={props.sessionLabel}
							/>
							<div className="mt-6">{props.authAction}</div>
						</Panel>
					</div>
				</Panel>

				<section className="grid gap-6 lg:grid-cols-2">
					<RoadmapCard
						description="Ce que je me suis fixé comme objectifs de base"
						items={coreMilestones}
						title="Objectifs de base"
					/>
					<RoadmapCard
						description="Ce que je me suis fixé une fois les objectifs de base atteints"
						items={requiredLaterModules}
						title="Objectifs bonus"
					/>
				</section>

				<RouteCard isSignedIn={props.isSignedIn} />
			</PageContainer>
		</PageShell>
	);
}

function RoadmapCard(props: {
	title: string;
	description: string;
	items: string[];
}) {
	return (
		<Panel>
			<SectionHeader description={props.description} title={props.title} />
			<ul className="mt-5 space-y-3">
				{props.items.map((item) => (
					<li
						className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 text-sm"
						key={item}
					>
						{item}
					</li>
				))}
			</ul>
		</Panel>
	);
}

function RouteCard(props: { isSignedIn: boolean }) {
	return (
		<Panel>
			<SectionHeader
				description={
					<>
						Les différentes pages et fonctionnalités disponibles dans
						l'application.
					</>
				}
				title="Routes accessibles"
			/>
			<ul className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
				{routeCatalog.map((route) => {
					const isSignedInWorkspace =
						route.path === "/transfer" || route.path === "/visio";
					const isAccessible = !isSignedInWorkspace || props.isSignedIn;

					return (
						<li
							className="rounded-lg border border-slate-200 bg-slate-50 p-4"
							key={route.path}
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<h3 className="font-semibold text-base text-slate-950">
										{route.title}
									</h3>
									<p className="mt-1 font-mono text-slate-500 text-sm">
										{route.path}
									</p>
								</div>
								<Badge variant={isAccessible ? "success" : "warning"}>
									{isAccessible ? route.availability : "Connexion requise"}
								</Badge>
							</div>
							<p className="mt-3 text-slate-600 text-sm leading-6">
								{route.description}
							</p>
							<Link
								className={buttonClasses("secondary", "mt-4")}
								href={route.href}
							>
								Ouvrir la route
							</Link>
						</li>
					);
				})}
			</ul>
		</Panel>
	);
}
