import { stat } from "node:fs/promises";
import fs from "node:fs/promises";
import path from "node:path";
import { basename, extname } from "node:path";
import { FileMetaInfo } from "./file-meta.js";

export async function getFileMetaInfo(filePath: string): Promise<FileMetaInfo> {
	const fileStat = await stat(filePath);

	return new FileMetaInfo({
		path: filePath,
		name: basename(filePath),
		ext: extname(filePath),
		sizeBytes: fileStat.size,
		createdAt: fileStat.birthtime,
	});
}

export class FileIterator {
	rootDirectoryPath: string;

	constructor(rootDirectory: string) {
		this.rootDirectoryPath = rootDirectory;
	}

	async *[Symbol.asyncIterator](): AsyncGenerator<string, void, undefined> {
		const entries = await fs.readdir(this.rootDirectoryPath, {
			withFileTypes: true,
		});
		const directories: string[] = [];
		for (const entry of entries) {
			if (entry.isFile()) {
				yield path.join(this.rootDirectoryPath, entry.name);
			} else if (entry.isDirectory()) {
				directories.push(path.join(this.rootDirectoryPath, entry.name));
			}
		}

		for (const directory of directories) {
			yield* new FileIterator(directory);
		}
	}
}
