import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Alert, Button, CheckboxRow } from "@/shared/ui";

describe("shared UI primitives", () => {
	it("renders disabled buttons as disabled controls", () => {
		render(
			<Button disabled type="button">
				Save changes
			</Button>,
		);

		expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
	});

	it("renders alert content", () => {
		render(<Alert variant="danger">Something went wrong.</Alert>);

		expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
	});

	it("associates checkbox row text with the checkbox", () => {
		render(<CheckboxRow name="terms">Accept terms</CheckboxRow>);

		expect(
			screen.getByRole("checkbox", { name: "Accept terms" }),
		).toBeInTheDocument();
	});
});
