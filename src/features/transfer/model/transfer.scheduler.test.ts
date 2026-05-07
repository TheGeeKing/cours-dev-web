// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const scheduleMock = vi.fn();
const deleteExpiredTransferFilesMock = vi.fn();

vi.mock("node-cron", () => ({
	default: {
		schedule: scheduleMock,
	},
}));

vi.mock("./transfer.service", () => ({
	deleteExpiredTransferFiles: deleteExpiredTransferFilesMock,
}));

describe("registerTransferCleanupScheduler", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		globalThis.__transferCleanupSchedulerStarted = undefined;
	});

	it("runs cleanup once and only schedules one cron job", async () => {
		const { registerTransferCleanupScheduler } = await import(
			"./transfer.scheduler"
		);

		expect(await registerTransferCleanupScheduler()).toBe(true);
		expect(await registerTransferCleanupScheduler()).toBe(false);
		expect(deleteExpiredTransferFilesMock).toHaveBeenCalledTimes(1);
		expect(scheduleMock).toHaveBeenCalledTimes(1);
	});
});
