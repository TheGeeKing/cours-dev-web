import path from "node:path";

export const TRANSFER_FILE_FIELD_NAME = "file";
export const TRANSFER_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
export const TRANSFER_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const TRANSFER_CLEANUP_CRON_EXPRESSION = "*/10 * * * *";

export const getTransferUploadsRoot = () =>
	path.join(process.cwd(), "uploads", "transfer");
