import { stat } from 'node:fs/promises'
import { basename, extname } from 'node:path'

import { FileMetaInfo } from './files'
import fs from 'node:fs/promises'
import path from 'path'

export async function getFileMetaInfo(filePath: string): Promise<FileMetaInfo> {
  const fileStat = await stat(filePath)

  const metaInfo = new FileMetaInfo({
    path: filePath,
    name: basename(filePath),
    ext: extname(filePath),
    sizeBytes: fileStat.size,
    createdAt: fileStat.birthtime,
  })

  return metaInfo
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
