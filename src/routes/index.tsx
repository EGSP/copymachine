import PathPicker from "#/components/PathPicker"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/")({ component: App })

function App() {
	const [sourcePath, setSourcePath] = useState("")

	return (
		<main className="page-wrap px-4 pb-8 pt-14">
			<p>Hello World</p>
			<div className="flex flex-col gap-4">
				<PathPicker
					label="Source Path"
					value={sourcePath}
					onChange={setSourcePath}
				/>
			</div>
		</main>
	)
}
