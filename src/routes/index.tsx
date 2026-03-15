import PathPicker from "#/components/PathPicker"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/")({ component: App })

function App() {
	const [sourcePath, setSourcePath] = useState("")
	const [targetPath, setTargetPath] = useState("")

	function startCopy(){
		
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
			</div>
		</main>
	)
}
