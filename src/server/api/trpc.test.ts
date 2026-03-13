// @vitest-environment node

import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/better-auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}));

vi.mock("@/server/db", () => ({
	db: {},
}));

describe("protectedProcedure", () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it("rejects unauthenticated callers", async () => {
		const { createCallerFactory, createTRPCRouter, protectedProcedure } =
			await import("@/server/api/trpc");

		const router = createTRPCRouter({
			secret: protectedProcedure.query(() => "protected"),
		});

		const createCaller = createCallerFactory(router);
		const caller = createCaller({
			db: {} as never,
			headers: new Headers(),
			session: null,
		});

		await expect(caller.secret()).rejects.toBeInstanceOf(TRPCError);
		await expect(caller.secret()).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});
});
