import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeShell } from "@/app/_components/home-shell";

describe("HomeShell", () => {
	it("renders the core app shell content", () => {
		render(
			<HomeShell
				authAction={<button type="button">Se connecter avec GitHub</button>}
				isSignedIn={false}
				sessionDescription="Connectez-vous pour utiliser toutes les fonctionnalités de l'application"
				sessionLabel="Connectez-vous pour commencer"
			/>,
		);

		expect(
			screen.getByRole("heading", {
				name: "Projet Cours Application Web",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Objectifs de base")).toBeInTheDocument();
		expect(screen.getByText("Objectifs bonus")).toBeInTheDocument();
		expect(screen.getByText("Routes accessibles")).toBeInTheDocument();
		expect(screen.getByText("/transfer")).toBeInTheDocument();
		expect(screen.getAllByText("Connexion requise")).toHaveLength(2);
		expect(
			screen.getByRole("button", { name: "Se connecter avec GitHub" }),
		).toBeInTheDocument();
	});
});
