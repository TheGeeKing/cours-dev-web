export async function register() {
	if (process.env.NEXT_RUNTIME !== "nodejs") {
		return;
	}

	const [
		{ registerTransferCleanupScheduler },
		{ registerVisioCleanupScheduler },
	] = await Promise.all([
		import("./features/transfer/model/transfer.scheduler"),
		import("./features/visio/model/visio.scheduler"),
	]);

	await Promise.all([
		registerTransferCleanupScheduler(),
		registerVisioCleanupScheduler(),
	]);
}
