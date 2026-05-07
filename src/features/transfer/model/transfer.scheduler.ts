import "server-only";

import cron from "node-cron";

import { TRANSFER_CLEANUP_CRON_EXPRESSION } from "./transfer.constants";
import { deleteExpiredTransferFiles } from "./transfer.service";

declare global {
	// eslint-disable-next-line no-var
	var __transferCleanupSchedulerStarted: boolean | undefined;
}

export const registerTransferCleanupScheduler = async () => {
	if (globalThis.__transferCleanupSchedulerStarted) {
		return false;
	}

	globalThis.__transferCleanupSchedulerStarted = true;

	await deleteExpiredTransferFiles();
	cron.schedule(TRANSFER_CLEANUP_CRON_EXPRESSION, () => {
		void deleteExpiredTransferFiles();
	});

	return true;
};
