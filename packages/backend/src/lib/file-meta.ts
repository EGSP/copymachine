import { getSizeAutoFromBytes } from "copymachine-shared";
import type { FileAutoSize } from "copymachine-shared";

function roundToTwo(value: number): number {
	return Math.round(value * 100) / 100;
}

/** Метаинформация о файле на диске (только бэкенд) */
export class FileMetaInfo {
	path: string;
	name: string;
	ext: string;
	sizeBytes: number;
	createdAt: Date;

	constructor(params: {
		path: string;
		name: string;
		ext: string;
		sizeBytes: number;
		createdAt: Date;
	}) {
		this.path = params.path;
		this.name = params.name;
		this.ext = params.ext;
		this.sizeBytes = params.sizeBytes;
		this.createdAt = params.createdAt;
	}

	getSizeKb(): number {
		return roundToTwo(this.sizeBytes / 1024);
	}

	getSizeMb(): number {
		return roundToTwo(this.sizeBytes / (1024 * 1024));
	}

	getSizeGb(): number {
		return roundToTwo(this.sizeBytes / (1024 * 1024 * 1024));
	}

	getSizeAuto(): FileAutoSize {
		return getSizeAutoFromBytes(this.sizeBytes);
	}
}
