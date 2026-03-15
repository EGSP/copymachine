import fs from "fs/promises"

export async function copy(sourcePath: string, targetPath: string) {

    const sourceType = await resolveType(sourcePath)
    const targetType = await resolveType(targetPath)


    const source = await fs.readFile(sourcePath)
    await fs.writeFile(targetPath, source)
}

async function resolveType(path:string): Promise<"file" | "directory"> {
    const stats = await fs.stat(path)
    return stats.isFile() ? "file" : "directory"
}
