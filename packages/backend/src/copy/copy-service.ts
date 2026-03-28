import fsn from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { CopyAnalysis } from "copymachine-shared";
import { getSizeAutoFromBytes, PathType } from "copymachine-shared";
import { FileIterator, getFileMetaInfo } from "../lib/fileIterator.js";
import type { FileMetaInfo } from "../lib/file-meta.js";

export async function analyzeCopy(
	sourcePath: string,
	targetPath: string,
): Promise<CopyAnalysis> {
	const files = await collectFilesToCopy(sourcePath, targetPath);
	const totalSizeBytes = files.reduce((acc, file) => acc + file.sizeBytes, 0);

	return {
		filesCount: files.length,
		totalSizeBytes,
		totalSize: getSizeAutoFromBytes(totalSizeBytes),
	};
}

export async function copy(sourcePath: string, targetPath: string) {
	const files = await collectFilesToCopy(sourcePath, targetPath);

	const size = getSizeAutoFromBytes(
		files.reduce((acc, file) => acc + file.sizeBytes, 0),
	);

	console.log(`Copying ${files.length} files totaling ${size.value} ${size.unit}.`);
	const concurrentTasks = 3;
	const tasks = new Set<Promise<void>>();
	for (const file of files) {
		const destination = mapItemPathToTarget(sourcePath, file.path, targetPath);
		const copyTask = copyFile(file.path, destination).finally(() =>
			tasks.delete(copyTask),
		);
		tasks.add(copyTask);
		if (tasks.size >= concurrentTasks) {
			await Promise.race(tasks);
		}
	}
	await Promise.all(tasks);

	console.log(`Copy completed for ${sourcePath} to ${targetPath}.`);
	console.log(`Copied ${files.length} files.`);
}

async function collectFilesToCopy(
	sourcePath: string,
	targetPath: string,
): Promise<FileMetaInfo[]> {
	const sourceType = await resolveType(sourcePath);
	const targetType = await resolveType(targetPath);

	if (sourceType !== PathType.DIRECTORY || targetType !== PathType.DIRECTORY) {
		throw new Error("Source and target must be directories");
	}

	const iterator = new FileIterator(sourcePath);
	const files: FileMetaInfo[] = [];
	for await (const file of iterator) {
		const metaInfo = await getFileMetaInfo(file);
		files.push(metaInfo);
	}

	return files;
}

async function copyFile(sourcePath: string, targetPath: string) {
	await fs.mkdir(path.dirname(targetPath), { recursive: true });
	await pipeline(
		fsn.createReadStream(sourcePath),
		fsn.createWriteStream(targetPath),
	);
}

export function mapItemPathToTarget(
	initialPath: string,
	itemPath: string,
	targetDirectory: string,
): string {
	const normalizedInitialPath = path.resolve(initialPath);
	const normalizedItemPath = path.resolve(itemPath);
	const relativeItemPath = path.relative(
		normalizedInitialPath,
		normalizedItemPath,
	);

	if (
		relativeItemPath === "" ||
		relativeItemPath === "." ||
		relativeItemPath.startsWith("..") ||
		path.isAbsolute(relativeItemPath)
	) {
		throw new Error(
			`Item path "${itemPath}" does not include initial path "${initialPath}"`,
		);
	}

	return path.join(targetDirectory, relativeItemPath);
}

async function resolveType(pathStr: string): Promise<PathType> {
	const stats = await fs.stat(pathStr);
	return stats.isFile() ? PathType.FILE : PathType.DIRECTORY;
}
