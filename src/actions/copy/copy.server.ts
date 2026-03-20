import fsn from "node:fs";
import fs from "fs/promises"
import path from "path";
import { pipeline } from "node:stream/promises"


type PathType = 'directory' | 'file';
export async function copy(sourcePath: string, targetPath: string) {

    const sourceType = await resolveType(sourcePath)
    const targetType = await resolveType(targetPath)

    if (sourceType !== 'directory' || targetType !== 'directory') {
        throw new Error('Source and target must be directories')
    }

    const iterator = new FileIterator(sourcePath)
    const files: string[] = [];
    for await (const file of iterator) {
        files.push(file)
    }

    const concurrentTasks = 3;
    const tasks = new Set<Promise<void>>();
    for (const file of files) {
        const destination = mapItemPathToTarget(sourcePath, file, targetPath)
        const copyTask =
            copyFile(file, destination)
                .finally(() => tasks.delete(copyTask))
        tasks.add(copyTask)
        if (tasks.size >= concurrentTasks) {
            await Promise.race(tasks)
        }
    }
    await Promise.all(tasks)

    console.log(`Copy completed for ${sourcePath} to ${targetPath}.`)
    console.log(`Copied ${files.length} files.`)
}

async function copyFile(sourcePath: string, targetPath: string) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await pipeline(
        fsn.createReadStream(sourcePath),
        fsn.createWriteStream(targetPath)
    )
}

export function mapItemPathToTarget(
    initialPath: string,
    itemPath: string,
    targetDirectory: string,
): string {
    const normalizedInitialPath = path.resolve(initialPath)
    const normalizedItemPath = path.resolve(itemPath)
    const relativeItemPath = path.relative(normalizedInitialPath, normalizedItemPath)

    if (
        relativeItemPath === '' ||
        relativeItemPath === '.' ||
        relativeItemPath.startsWith('..') ||
        path.isAbsolute(relativeItemPath)
    ) {
        throw new Error(`Item path "${itemPath}" does not include initial path "${initialPath}"`)
    }

    return path.join(targetDirectory, relativeItemPath)
}

async function resolveType(path: string): Promise<PathType> {
    const stats = await fs.stat(path)
    return stats.isFile() ? 'file' : 'directory'
}


class FileIterator {
    rootDirectoryPath: string;

    constructor(rootDirectory: string) {
        this.rootDirectoryPath = rootDirectory
    }

    async *[Symbol.asyncIterator](): AsyncGenerator<string, void, undefined> {
        const entries = await fs.readdir(this.rootDirectoryPath,
            { withFileTypes: true }
        )
        const directories: string[] = [];
        for (const entry of entries) {
            if (entry.isFile()) {
                yield path.join(this.rootDirectoryPath, entry.name)
            } else if (entry.isDirectory()) {
                directories.push(path.join(this.rootDirectoryPath, entry.name))
            }
        }

        for (const directory of directories) {
            yield* new FileIterator(directory)
        }
    }
}