import PathPicker from "#/components/PathPicker"
import { Button } from "#/components/ui/button"
import { startCopy } from "#/actions/copy/copy.functions"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/")({ component: App })

function App() {
	const [sourcePath, setSourcePath] = useState("")
	const [targetPath, setTargetPath] = useState("")

	async function handleStartCopy() {
		await (
			startCopy as unknown as (args: {
				data: { sourcePath: string; targetPath: string }
			}) => Promise<void>
		)({ data: { sourcePath, targetPath } })
	}

	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			<p>Hello World</p>
			<div className="flex flex-col gap-4">
				<PathPicker
					label="Source Path"
					value={sourcePath}
					onChange={setSourcePath}
				/>
				<PathPicker
					label="Target Path"
					value={targetPath}
					onChange={setTargetPath}
				/>
				<Button variant={"default"} onClick={handleStartCopy}>Start copy</Button>
			</div>
		</main>
	)
}
