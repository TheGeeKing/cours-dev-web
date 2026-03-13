import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { HomeShell } from "@/app/_components/home-shell";
import { auth } from "@/server/better-auth";
import { getSession } from "@/server/better-auth/server";

export default async function Home() {
	const session = await getSession();
	const displayName =
		session?.user.name ?? session?.user.email ?? "GitHub user";

	const sessionLabel = session
		? "Ready for authenticated flows"
		: "Sign in to start";
	const sessionDescription = session
		? `Connected as ${displayName}. Upcoming commits will attach account, cart, checkout, and order history to this GitHub identity.`
		: "The next feature commits will assume a GitHub-authenticated user. Sign in now if you want the baseline ready for protected account and cart flows.";

	return (
		<HomeShell
			authAction={
				session ? (
					<form>
						<button
							className="w-full rounded-full bg-stone-50 px-5 py-3 font-semibold text-stone-950 transition hover:bg-emerald-100"
							formAction={async () => {
								"use server";
								await auth.api.signOut({
									headers: await headers(),
								});
								redirect("/");
							}}
							type="submit"
						>
							Sign out
						</button>
					</form>
				) : (
					<form>
						<button
							className="w-full rounded-full bg-emerald-400 px-5 py-3 font-semibold text-stone-950 transition hover:bg-emerald-300"
							formAction={async () => {
								"use server";
								const res = await auth.api.signInSocial({
									body: {
										provider: "github",
										callbackURL: "/",
									},
								});
								if (!res.url) {
									throw new Error("No URL returned from signInSocial");
								}
								redirect(res.url);
							}}
							type="submit"
						>
							Sign in with GitHub
						</button>
					</form>
				)
			}
			sessionDescription={sessionDescription}
			sessionLabel={sessionLabel}
		/>
	);
}
