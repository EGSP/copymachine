import type { FileAutoSize } from "./files.js";

/** Тело запроса анализа / старта копирования */
export type StartCopyData = {
	sourcePath: string;
	targetPath: string;
};

export type CopyAnalysis = {
	filesCount: number;
	totalSizeBytes: number;
	totalSize: FileAutoSize;
};
