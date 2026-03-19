import fs from "fs/promises"
import path from "path";


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
    const sortedFiles = files.sort((a, b) =>
        a.localeCompare(b))

    for (const file of sortedFiles) {
        console.log(file);
    }

    throw new Error('Not implemented')
    // const source = await fs.readFile(sourcePath)
    // await fs.writeFile(targetPath, source)
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