import { createServerFn } from "@tanstack/react-start";
import { analyzeCopy, copy } from "#/actions/copy/copy.server";

type StartCopyData = {
	sourcePath: string;
	targetPath: string;
};

export const startCopy = createServerFn({ method: "POST" })
	.inputValidator((data: StartCopyData) => data)
	.handler(async ({ data }) => {
		await copy(data.sourcePath, data.targetPath);
	});

export const getCopyAnalysis = createServerFn({ method: "POST" })
	.inputValidator((data: StartCopyData) => data)
	.handler(async ({ data }) => {
		return analyzeCopy(data.sourcePath, data.targetPath);
	});
