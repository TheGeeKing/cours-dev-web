import "server-only";

import { randomBytes } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { and, eq, inArray, lte } from "drizzle-orm";

import { db } from "@/server/db";
import { transferFile } from "@/server/db/schema";
import {
	getTransferUploadsRoot,
	TRANSFER_RETENTION_MS,
} from "./transfer.constants";
import { TransferError } from "./transfer.errors";
import type {
	TransferShareState,
	TransferShareViewModel,
	TransferUploadResponse,
} from "./transfer.types";

type TransferRecord = typeof transferFile.$inferSelect;

const buildTransferSharePath = (slug: string) => `/transfer/${slug}`;
const buildTransferDownloadPath = (slug: string) =>
	`/api/transfer/${slug}/download`;

const buildStoredFilename = (slug: string, originalFilename: string) => {
	const ext = path.extname(path.basename(originalFilename));
	return ext ? `${slug}${ext}` : slug;
};

const resolveTransferStoragePath = (storagePath: string) =>
	path.join(getTransferUploadsRoot(), storagePath);

const ensureTransferFileExists = async (storagePath: string) => {
	try {
		await access(resolveTransferStoragePath(storagePath));
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return false;
		}
		throw error;
	}
};

const mapRecordToShareViewModel = (
	record: TransferRecord,
): TransferShareViewModel => ({
	slug: record.shareSlug,
	sharePath: buildTransferSharePath(record.shareSlug),
	downloadPath: buildTransferDownloadPath(record.shareSlug),
	originalFilename: record.originalFilename,
	mimeType: record.mimeType,
	sizeBytes: record.sizeBytes,
	createdAt: record.createdAt,
	expiresAt: record.expiresAt,
});

const mapRecordToUploadResponse = (
	record: TransferRecord,
): TransferUploadResponse => ({
	slug: record.shareSlug,
	sharePath: buildTransferSharePath(record.shareSlug),
	originalFilename: record.originalFilename,
	mimeType: record.mimeType,
	sizeBytes: record.sizeBytes,
	createdAt: record.createdAt.toISOString(),
	expiresAt: record.expiresAt.toISOString(),
});

const isExpired = (record: Pick<TransferRecord, "expiresAt">, now: Date) =>
	record.expiresAt.getTime() <= now.getTime();

export const saveUploadedTransferFile = async (input: {
	file: File;
	ownerUserId: string;
}) => {
	const slug = randomBytes(18).toString("base64url");
	const originalFilename = path.basename(input.file.name || "upload.bin");
	const storedFilename = buildStoredFilename(slug, originalFilename);
	const storagePath = storedFilename;
	const absolutePath = resolveTransferStoragePath(storagePath);
	const now = new Date();
	const expiresAt = new Date(now.getTime() + TRANSFER_RETENTION_MS);

	await mkdir(getTransferUploadsRoot(), { recursive: true });
	await writeFile(absolutePath, Buffer.from(await input.file.arrayBuffer()));

	try {
		const [record] = await db
			.insert(transferFile)
			.values({
				ownerUserId: input.ownerUserId,
				shareSlug: slug,
				originalFilename,
				storedFilename,
				mimeType: input.file.type || "application/octet-stream",
				sizeBytes: input.file.size,
				storagePath,
				expiresAt,
			})
			.returning();

		if (!record) {
			throw new TransferError(
				"Les métadonnées du transfert n'ont pas pu être enregistrées.",
				500,
				"INTERNAL_ERROR",
			);
		}

		return mapRecordToUploadResponse(record);
	} catch (error) {
		await unlink(absolutePath).catch(() => undefined);
		throw error;
	}
};

export const getTransferFileBySlug = async (slug: string) => {
	const [record] = await db
		.select()
		.from(transferFile)
		.where(eq(transferFile.shareSlug, slug))
		.limit(1);

	return record ?? null;
};

export const getTransferShareState = async (
	slug: string,
	now = new Date(),
): Promise<TransferShareState> => {
	const record = await getTransferFileBySlug(slug);

	if (!record) {
		return { status: "missing" };
	}

	if (isExpired(record, now)) {
		return {
			status: "expired",
			originalFilename: record.originalFilename,
			expiredAt: record.expiresAt,
		};
	}

	if (!(await ensureTransferFileExists(record.storagePath))) {
		return { status: "missing" };
	}

	return {
		status: "ready",
		transfer: mapRecordToShareViewModel(record),
	};
};

export const streamTransferFileBySlug = async (
	slug: string,
	now = new Date(),
) => {
	const record = await getTransferFileBySlug(slug);

	if (!record) {
		throw new TransferError("Lien de transfert introuvable.", 404, "NOT_FOUND");
	}

	if (isExpired(record, now)) {
		throw new TransferError("Lien de transfert expiré.", 410, "EXPIRED");
	}

	const absolutePath = resolveTransferStoragePath(record.storagePath);
	if (!(await ensureTransferFileExists(record.storagePath))) {
		throw new TransferError(
			"Fichier de transfert introuvable.",
			404,
			"NOT_FOUND",
		);
	}

	const stream = Readable.toWeb(createReadStream(absolutePath));
	return {
		transfer: mapRecordToShareViewModel(record),
		stream,
	};
};

export const deleteExpiredTransferFiles = async (now = new Date()) => {
	const expiredTransfers = await db
		.select()
		.from(transferFile)
		.where(lte(transferFile.expiresAt, now));

	for (const record of expiredTransfers) {
		const absolutePath = resolveTransferStoragePath(record.storagePath);
		try {
			await unlink(absolutePath);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
				throw error;
			}
		}
	}

	if (expiredTransfers.length === 0) {
		return { deletedCount: 0 };
	}

	await db.delete(transferFile).where(
		and(
			lte(transferFile.expiresAt, now),
			inArray(
				transferFile.id,
				expiredTransfers.map((record) => record.id),
			),
		),
	);

	return { deletedCount: expiredTransfers.length };
};
