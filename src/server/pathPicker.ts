import { createServerFn } from "@tanstack/react-start"

export const chooseFolder = createServerFn({ method: "POST" }).handler(async (): Promise<string | null> => {
	const { openFolder } = await import("./pathPickerImpl.js")
	return openFolder()
})

export const chooseFile = createServerFn({ method: "POST" }).handler(async (): Promise<string | null> => {
	const { openFile } = await import("./pathPickerImpl.js")
	return openFile()
})
