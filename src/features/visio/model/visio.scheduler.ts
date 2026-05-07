import "server-only";

import cron from "node-cron";

import { VISIO_CLEANUP_CRON_EXPRESSION } from "./visio.constants";
import { deleteExpiredVisioRooms } from "./visio.service";

declare global {
	// eslint-disable-next-line no-var
	var __visioCleanupSchedulerStarted: boolean | undefined;
}

export const registerVisioCleanupScheduler = async () => {
	if (globalThis.__visioCleanupSchedulerStarted) {
		return false;
	}

	globalThis.__visioCleanupSchedulerStarted = true;

	await deleteExpiredVisioRooms();
	cron.schedule(VISIO_CLEANUP_CRON_EXPRESSION, () => {
		void deleteExpiredVisioRooms();
	});

	return true;
};
