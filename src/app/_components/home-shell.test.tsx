import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HomeShell } from "@/app/_components/home-shell";

describe("HomeShell", () => {
	it("renders the core app shell content", () => {
		render(
			<HomeShell
				authAction={<button type="button">Sign in with GitHub</button>}
				sessionDescription="The baseline is ready for protected flows."
				sessionLabel="Sign in to start"
			/>,
		);

		expect(
			screen.getByRole("heading", {
				name: "From scaffold to a real exam application.",
			}),
		).toBeInTheDocument();
		expect(screen.getByText("Core milestones")).toBeInTheDocument();
		expect(screen.getByText("Required later modules")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Sign in with GitHub" }),
		).toBeInTheDocument();
	});
});
