import { Folder } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { type PathPickMode, usePathPickMutation } from "#/lib/queries/pathPick";
import { cn } from "#/lib/utils";

export type PathPickerMode = PathPickMode;

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
	const fieldId = useId();
	const [inputValue, setInputValue] = useState(value);
	const pickerLabel = mode === "folder" ? "Выбрать папку" : "Выбрать файл";
	const pickMutation = usePathPickMutation();

	useEffect(() => {
		setInputValue(value);
	}, [value]);

	const openPicker = () => {
		if (disabled) return;
		pickMutation.mutate(mode, {
			onSuccess: (path) => {
				if (path != null && path !== "") {
					setInputValue(path);
					onChange(path);
				}
			},
		});
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const next = e.target.value;
		setInputValue(next);
		onChange(next);
	};

	return (
		<div className={cn("flex min-w-0 flex-col gap-1", className)}>
			<label htmlFor={fieldId} className="text-xs font-medium text-foreground">
				{label}
			</label>
			<div className="flex min-w-0 items-stretch gap-2">
				<Input
					id={fieldId}
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
					disabled={disabled || pickMutation.isPending}
					aria-label={pickerLabel}
					title={pickerLabel}
				>
					<Folder className="size-5" aria-hidden />
				</Button>
			</div>
		</div>
	);
}
