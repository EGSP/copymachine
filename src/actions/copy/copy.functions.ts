import { copy } from "#/actions/copy/copy.server"
import { createServerFn } from "@tanstack/react-start"

type StartCopyData = {
	sourcePath: string
	targetPath: string
}

export const startCopy = createServerFn({ method: "POST" })
	.inputValidator((data: StartCopyData) => data)
	.handler(async ({ data }) => {
		await copy(data.sourcePath, data.targetPath)
	})
