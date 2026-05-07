import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VisioCreateRoomForm } from "./visio-create-room-form";

describe("VisioCreateRoomForm", () => {
	it("prefills the host display name", () => {
		render(<VisioCreateRoomForm defaultDisplayName="Alice Host" />);

		expect(screen.getByDisplayValue("Alice Host")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Create room" }),
		).toBeInTheDocument();
	});
});
