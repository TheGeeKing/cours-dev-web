import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCProvider } from "@/trpc/client";

export const metadata: Metadata = {
	title: "Application web d'examen modulaire",
	description:
		"Application full-stack orientée examen, construite avec Next.js, tRPC, Drizzle et Better Auth.",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${geist.variable}`} lang="fr">
			<body>
				<TRPCProvider>{children}</TRPCProvider>
			</body>
		</html>
	);
}
