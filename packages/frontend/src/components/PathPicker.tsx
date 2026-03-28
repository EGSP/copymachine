import { Folder } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { api, treatyData } from "#/lib/api";
import { cn } from "#/lib/utils";

export type PathPickerMode = "file" | "folder";

export type PathPickerProps = {
	label: string;
	value: string;
	onChange: (path: string) => void;
	mode?: PathPickerMode;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
};

export default function PathPicker({
	label,
	value,
	onChange,
	mode = "folder",
	placeholder,
	disabled = false,
	className = "",
}: PathPickerProps) {
	const [inputValue, setInputValue] = useState(value);
	const pickerLabel = mode === "folder" ? "Выбрать папку" : "Выбрать файл";

	useEffect(() => {
		setInputValue(value);
	}, [value]);

	const openPicker = async () => {
		if (disabled) return;
		const path =
			mode === "folder"
				? await treatyData(api.api["path-pick"].folder.post())
				: await treatyData(api.api["path-pick"].file.post());
		if (path != null && path !== "") {
			setInputValue(path);
			onChange(path);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const next = e.target.value;
		setInputValue(next);
		onChange(next);
	};

	return (
		<div className={cn("flex min-w-0 flex-col gap-1", className)}>
			<label className="text-xs font-medium text-foreground">{label}</label>
			<div className="flex min-w-0 items-stretch gap-2">
				<Input
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					placeholder={placeholder}
					disabled={disabled}
					className="min-w-0 flex-1"
					aria-label={label}
				/>
				<Button
					variant="outline"
					size="icon"
					onClick={openPicker}
					disabled={disabled}
					aria-label={pickerLabel}
					title={pickerLabel}
				>
					<Folder className="size-5" aria-hidden />
				</Button>
			</div>
		</div>
	);
}
