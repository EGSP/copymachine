import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const dialog = require("popups-file-dialog") as {
	openDirectory: (opts?: { title?: string }) => Promise<string>;
	openFile: (opts?: {
		title?: string;
		allowMultipleSelects?: boolean;
	}) => Promise<string[]>;
};

export async function openFolder(): Promise<string | null> {
	try {
		return (await dialog.openDirectory()) ?? null;
	} catch {
		return null;
	}
}

export async function openFile(): Promise<string | null> {
	try {
		const paths = await dialog.openFile({ allowMultipleSelects: false });
		return paths?.[0] ?? null;
	} catch {
		return null;
	}
}
