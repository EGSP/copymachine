import { useEffect, useState } from "react"
import { Folder } from "lucide-react"
import { chooseFolder, chooseFile } from "#/server/pathPicker"

export type PathPickerMode = "file" | "folder"

export type PathPickerProps = {
	label: string
	value: string
	onChange: (path: string) => void
	mode?: PathPickerMode
	placeholder?: string
	disabled?: boolean
	className?: string
}

export default function PathPicker({
	label,
	value,
	onChange,
	mode = "folder",
	placeholder,
	disabled = false,
	className = "",
}: PathPickerProps) {
	const [inputValue, setInputValue] = useState(value)

	useEffect(() => {
		setInputValue(value)
	}, [value])

	const openPicker = async () => {
		if (disabled) return
		const pick = mode === "folder" ? chooseFolder : chooseFile
		const path = await pick()
		if (path != null && path !== "") {
			setInputValue(path)
			onChange(path)
		}
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const next = e.target.value
		setInputValue(next)
		onChange(next)
	}

	return (
		<div className={`flex min-w-0 flex-col ${className}`.trim()}>
			<label className="mb-1 block text-sm font-medium text-[var(--sea-ink)]">
				{label}
			</label>
			<div className="flex min-w-0 items-stretch gap-2">
				<input
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					placeholder={placeholder}
					disabled={disabled}
					className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] focus:border-[var(--lagoon-deep)] focus:outline-none focus:ring-1 focus:ring-[var(--lagoon-deep)] disabled:opacity-60"
					aria-label={label}
				/>
				<button
					type="button"
					onClick={openPicker}
					disabled={disabled}
					title={mode === "folder" ? "Выбрать папку" : "Выбрать файл"}
					className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink)] transition hover:border-[var(--lagoon-deep)] hover:bg-[var(--chip-bg)] disabled:opacity-60"
					aria-label={mode === "folder" ? "Выбрать папку" : "Выбрать файл"}
				>
					<Folder className="size-5" aria-hidden />
				</button>
			</div>
		</div>
	)
}
