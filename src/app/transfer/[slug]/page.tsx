import { TransferShareShell } from "@/features/transfer/view/transfer-share-shell";
import { getTransferShareState } from "@/features/transfer/model/transfer.service";

export default async function TransferSharePage(props: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await props.params;
	const state = await getTransferShareState(slug);

	return <TransferShareShell state={state} />;
}
