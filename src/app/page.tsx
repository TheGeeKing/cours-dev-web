import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { HomeShell } from "@/app/_components/home-shell";
import { auth } from "@/server/better-auth";
import { getSession } from "@/server/better-auth/server";
import { Button } from "@/shared/ui";

export default async function Home() {
	const session = await getSession();
	const displayName =
		session?.user.name ?? session?.user.email ?? "Utilisateur GitHub";

	const sessionLabel = session ? "Connecté" : "Connectez-vous pour commencer";
	const sessionDescription = session
		? `Connecté en tant que ${displayName}.`
		: "Connectez-vous pour utiliser toutes les fonctionnalités de l'application";

	return (
		<HomeShell
			authAction={
				session ? (
					<form>
						<Button
							className="w-full bg-white text-slate-900 hover:bg-slate-100"
							formAction={async () => {
								"use server";
								await auth.api.signOut({
									headers: await headers(),
								});
								redirect("/");
							}}
							type="submit"
						>
							Se déconnecter
						</Button>
					</form>
				) : (
					<form>
						<Button
							className="w-full bg-white text-slate-900 hover:bg-slate-100"
							formAction={async () => {
								"use server";
								const res = await auth.api.signInSocial({
									body: {
										provider: "github",
										callbackURL: "/",
									},
								});
								if (!res.url) {
									throw new Error("Aucune URL renvoyée par signInSocial");
								}
								redirect(res.url);
							}}
							type="submit"
						>
							Se connecter avec GitHub
						</Button>
					</form>
				)
			}
			isSignedIn={!!session}
			sessionDescription={sessionDescription}
			sessionLabel={sessionLabel}
		/>
	);
}
