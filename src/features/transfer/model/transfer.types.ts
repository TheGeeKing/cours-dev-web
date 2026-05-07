export type TransferUploadResponse = {
	slug: string;
	sharePath: string;
	originalFilename: string;
	mimeType: string;
	sizeBytes: number;
	createdAt: string;
	expiresAt: string;
};

export type TransferShareViewModel = {
	slug: string;
	sharePath: string;
	downloadPath: string;
	originalFilename: string;
	mimeType: string;
	sizeBytes: number;
	createdAt: Date;
	expiresAt: Date;
};

export type TransferShareState =
	| {
			status: "ready";
			transfer: TransferShareViewModel;
	  }
	| {
			status: "expired";
			originalFilename: string;
			expiredAt: Date;
	  }
	| {
			status: "missing";
	  };
