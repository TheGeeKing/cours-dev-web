import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCProvider } from "@/trpc/client";

export const metadata: Metadata = {
	title: "Modular Exam Web Application",
	description:
		"Exam-oriented full-stack application built with Next.js, tRPC, Drizzle, and Better Auth.",
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
		<html className={`${geist.variable}`} lang="en">
			<body>
				<TRPCProvider>{children}</TRPCProvider>
			</body>
		</html>
	);
}
