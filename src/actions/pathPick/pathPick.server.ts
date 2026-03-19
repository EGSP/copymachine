import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const dialog = require("node-file-dialog") as (config: { type: string }) => Promise<string[]>

export async function openFolder(): Promise<string | null> {
	try {
		const paths = await dialog({ type: "directory" })
		return paths?.[0] ?? null
	} catch {
		return null
	}
}

export async function openFile(): Promise<string | null> {
	try {
		const paths = await dialog({ type: "open-file" })
		return paths?.[0] ?? null
	} catch {
		return null
	}
}
