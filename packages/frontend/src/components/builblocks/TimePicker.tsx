import * as React from "react";
import { createPortal } from "react-dom";

import { isTime } from "copymachine-shared";
import { Input } from "#/components/ui/input";
import { cn } from "#/lib/utils";

import { ListBox } from "./ListBox";

const DROPDOWN_OFFSET_REM = 0.5;
const DROPDOWN_MAX_HEIGHT_REM = 15;
const DROPDOWN_MIN_HEIGHT_REM = 7.5;
const DROPDOWN_WIDTH_REM = 5.5;

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
	const totalMinutes = index * 15;
	const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
	const minutes = String(totalMinutes % 60).padStart(2, "0");
	return `${hours}:${minutes}`;
});

type TimePickerProps = Omit<
	React.ComponentProps<"input">,
	"type" | "value" | "defaultValue" | "onChange"
> & {
	value?: string;
	defaultValue?: string;
	onChange?: (value: string) => void;
	validate?: (value: string) => boolean;
};

function formatDigitsToTime(value: string): string {
	const digits = value.replace(/\D/g, "").slice(0, 4);
	if (digits.length <= 2) {
		return digits;
	}
	return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function countDigitsBeforeCaret(text: string, caretPosition: number): number {
	return text.slice(0, caretPosition).replace(/\D/g, "").length;
}

function getCaretPositionFromDigitsCount(
	formattedValue: string,
	digitsCount: number,
): number {
	if (digitsCount <= 0) return 0;
	let seenDigits = 0;
	for (let index = 0; index < formattedValue.length; index += 1) {
		if (/\d/.test(formattedValue[index] ?? "")) {
			seenDigits += 1;
		}
		if (seenDigits >= digitsCount) {
			return index + 1;
		}
	}
	return formattedValue.length;
}

type DropdownPosition = {
	top: number;
	left: number;
	maxHeight: number;
	placement: "top" | "bottom";
};

export default function TimePicker({
	value,
	defaultValue,
	onChange,
	validate,
	onFocus,
	onBlur,
	onKeyDown,
	onMouseDown,
	className,
	disabled,
	"aria-invalid": ariaInvalidProp,
	placeholder = "HH:MM",
	...props
}: TimePickerProps) {
	const wrapperRef = React.useRef<HTMLDivElement | null>(null);
	const inputRef = React.useRef<HTMLInputElement | null>(null);
	const dropdownRef = React.useRef<HTMLDivElement | null>(null);
	const suppressNextFocusOpenRef = React.useRef(false);

	const isControlled = value !== undefined;
	const [internalValue, setInternalValue] = React.useState(
		formatDigitsToTime(defaultValue ?? ""),
	);
	const currentValue = isControlled
		? formatDigitsToTime(value ?? "")
		: internalValue;

	const [isOpen, setIsOpen] = React.useState(false);
	const [dropdownPosition, setDropdownPosition] =
		React.useState<DropdownPosition | null>(null);

	const selectedIndex = TIME_OPTIONS.indexOf(currentValue);
	const validateTime = validate ?? isTime;

	const updateValue = React.useCallback(
		(nextValue: string) => {
			const formattedValue = formatDigitsToTime(nextValue);
			if (!isControlled) {
				setInternalValue(formattedValue);
			}
			onChange?.(formattedValue);
		},
		[isControlled, onChange],
	);

	const updateDropdownPosition = React.useCallback(() => {
		const wrapper = wrapperRef.current;
		if (!wrapper) return;

		const rect = wrapper.getBoundingClientRect();
		const remSize =
			Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
		const offset = DROPDOWN_OFFSET_REM * remSize;
		const preferredMaxHeight = DROPDOWN_MAX_HEIGHT_REM * remSize;
		const minHeight = DROPDOWN_MIN_HEIGHT_REM * remSize;
		const spaceBelow = window.innerHeight - rect.bottom - offset;
		const spaceAbove = rect.top - offset;
		const shouldOpenTop = spaceBelow < minHeight && spaceAbove > spaceBelow;
		const availableSpace = shouldOpenTop ? spaceAbove : spaceBelow;
		const maxHeight = Math.max(
			Math.min(preferredMaxHeight, availableSpace),
			minHeight,
		);
		const top = shouldOpenTop
			? Math.max(offset, rect.top - maxHeight - offset)
			: rect.bottom + offset;

		setDropdownPosition({
			top,
			left: rect.left,
			maxHeight,
			placement: shouldOpenTop ? "top" : "bottom",
		});
	}, []);

	React.useEffect(() => {
		if (!isOpen) return;

		const handlePointerDown = (event: MouseEvent) => {
			const target = event.target as Node | null;
			if (!target) return;
			if (wrapperRef.current?.contains(target)) return;
			if (dropdownRef.current?.contains(target)) return;
			setIsOpen(false);
		};

		document.addEventListener("mousedown", handlePointerDown, true);
		return () => {
			document.removeEventListener("mousedown", handlePointerDown, true);
		};
	}, [isOpen]);

	React.useEffect(() => {
		if (!isOpen) return;
		updateDropdownPosition();

		const handleReposition = () => updateDropdownPosition();
		window.addEventListener("resize", handleReposition);
		window.addEventListener("scroll", handleReposition, true);

		return () => {
			window.removeEventListener("resize", handleReposition);
			window.removeEventListener("scroll", handleReposition, true);
		};
	}, [isOpen, updateDropdownPosition]);

	React.useEffect(() => {
		if (!isOpen) return;

		requestAnimationFrame(() => {
			const dropdown = dropdownRef.current;
			if (!dropdown) return;

			const selectedItem = dropdown.querySelector<HTMLElement>('[aria-selected="true"]');
			if (selectedItem) {
				dropdown.scrollTop =
					selectedItem.offsetTop -
					dropdown.clientHeight / 2 +
					selectedItem.clientHeight / 2;
				return;
			}

			dropdown.scrollTop = Math.max(
				0,
				(dropdown.scrollHeight - dropdown.clientHeight) / 2,
			);
		});
	}, [isOpen]);

	const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
		if (disabled) return;
		if (suppressNextFocusOpenRef.current) {
			suppressNextFocusOpenRef.current = false;
			onFocus?.(event);
			return;
		}
		setIsOpen(true);
		onFocus?.(event);
	};

	const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
		// Даём браузеру обновить activeElement, затем проверяем выход фокуса за пределы контрола.
		requestAnimationFrame(() => {
			const activeElement = document.activeElement;
			if (
				activeElement &&
				(wrapperRef.current?.contains(activeElement) ||
					dropdownRef.current?.contains(activeElement))
			) {
				return;
			}
			setIsOpen(false);
		});
		onBlur?.(event);
	};

	const handleSelect = (nextValue: string) => {
		updateValue(nextValue);
		setIsOpen(false);
		suppressNextFocusOpenRef.current = true;
		inputRef.current?.focus();
	};

	return (
		<div ref={wrapperRef} className="relative w-full min-w-0">
			<Input
				ref={inputRef}
				type="text"
				value={currentValue}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onChange={(event) => {
					const rawValue = event.target.value;
					const selectionStart = event.currentTarget.selectionStart ?? rawValue.length;
					const digitsBeforeCaret = countDigitsBeforeCaret(rawValue, selectionStart);
					const formattedValue = formatDigitsToTime(rawValue);

					updateValue(rawValue);

					requestAnimationFrame(() => {
						const input = inputRef.current;
						if (!input) return;
						const nextCaretPosition = getCaretPositionFromDigitsCount(
							formattedValue,
							digitsBeforeCaret,
						);
						input.setSelectionRange(nextCaretPosition, nextCaretPosition);
					});
				}}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						setIsOpen(false);
					}
					onKeyDown?.(event);
				}}
				onMouseDown={(event) => {
					onMouseDown?.(event);
					if (!disabled) {
						setIsOpen(true);
					}
				}}
				inputMode="numeric"
				autoComplete="off"
				placeholder={placeholder}
				disabled={disabled}
				blurOnEnter
				validate={validateTime}
				aria-invalid={ariaInvalidProp}
				aria-expanded={isOpen}
				aria-haspopup="listbox"
				className={className}
				{...props}
			/>
			{isOpen && dropdownPosition
				? createPortal(
						<div
							ref={dropdownRef}
							style={{
								position: "fixed",
								top: dropdownPosition.top,
								left: dropdownPosition.left,
								width: `${DROPDOWN_WIDTH_REM}rem`,
								maxHeight: dropdownPosition.maxHeight,
								zIndex: 50,
							}}
							className={cn(
								"overflow-auto border border-border bg-background shadow-sm",
								dropdownPosition.placement === "top" ? "origin-bottom" : "origin-top",
							)}
						>
							<ListBox
								items={TIME_OPTIONS}
								selectedIndex={selectedIndex >= 0 ? selectedIndex : null}
								onSelect={(item) => handleSelect(item)}
								ariaLabel="Выбор времени"
								className="border-0"
								itemClassName="rounded-none py-1.5"
							/>
						</div>,
						document.body,
					)
				: null}
		</div>
	);
}
