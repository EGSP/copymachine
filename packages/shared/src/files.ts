/** Единицы отображения размера файла */
export type FileSizeUnit = "B" | "KB" | "MB" | "GB";

export type FileAutoSize = {
	value: number;
	unit: FileSizeUnit;
};

function roundToTwo(value: number): number {
	return Math.round(value * 100) / 100;
}

export function getSizeAutoFromBytes(sizeBytes: number): FileAutoSize {
	if (sizeBytes < 1024) {
		return {
			value: roundToTwo(sizeBytes),
			unit: "B",
		};
	}

	if (sizeBytes < 1024 * 1024) {
		return {
			value: roundToTwo(sizeBytes / 1024),
			unit: "KB",
		};
	}

	if (sizeBytes < 1024 * 1024 * 1024) {
		return {
			value: roundToTwo(sizeBytes / (1024 * 1024)),
			unit: "MB",
		};
	}

	return {
		value: roundToTwo(sizeBytes / (1024 * 1024 * 1024)),
		unit: "GB",
	};
}

export enum PathType {
	DIRECTORY = "directory",
	FILE = "file",
}

export type PathInfo = {
	path: string;
	type: PathType;
};
