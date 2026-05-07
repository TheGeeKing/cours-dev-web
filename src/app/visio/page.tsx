import { redirect } from "next/navigation";

import { VisioCreateRoomForm } from "@/features/visio/view/visio-create-room-form";
import { getSession } from "@/server/better-auth/server";

export default async function VisioPage() {
	const session = await getSession();

	if (!session?.user) {
		redirect("/");
	}

	return (
		<main className="min-h-screen bg-[linear-gradient(180deg,#f7f3eb_0%,#dfe8dc_45%,#f2ede2_100%)] px-4 py-10 text-stone-900 sm:px-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
				<div className="rounded-[1.75rem] border border-stone-900/10 bg-white/75 px-6 py-5 shadow-[0_16px_48px_rgba(41,37,36,0.08)] backdrop-blur">
					<p className="font-semibold text-emerald-700 text-sm uppercase tracking-[0.3em]">
						Signed in
					</p>
					<p className="mt-2 text-sm text-stone-600 leading-6">
						Hosting as {session.user.name ?? session.user.email}. Create a room,
						copy the join link, then open the room page to manage access and call
						controls.
					</p>
				</div>

				<VisioCreateRoomForm
					defaultDisplayName={session.user.name ?? session.user.email ?? "Host"}
				/>
			</div>
		</main>
	);
}
