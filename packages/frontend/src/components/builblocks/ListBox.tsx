import * as React from "react";

import { cn } from "#/lib/utils";

type ListBoxItemRendererParams<T> = {
	item: T;
	index: number;
	selected: boolean;
};

export type ListBoxProps<T> = {
	items: T[];
	selectedIndex?: number | null;
	defaultSelectedIndex?: number | null;
	onSelect?: (item: T, index: number) => void;
	/** If omitted, list item keys fall back to the row index. */
	getItemKey?: (item: T, index: number) => React.Key;
	renderItem?: (params: ListBoxItemRendererParams<T>) => React.ReactNode;
	disabled?: boolean;
	className?: string;
	itemClassName?: string;
	ariaLabel?: string;
};

export type ListBoxItemProps = {
	selected?: boolean;
	disabled?: boolean;
	onClick?: () => void;
	children: React.ReactNode;
	className?: string;
};

export function ListBoxItem({
	selected = false,
	disabled = false,
	onClick,
	children,
	className,
}: ListBoxItemProps) {
	return (
		<button
			type="button"
			role="option"
			aria-selected={selected}
			disabled={disabled}
			onClick={onClick}
			className={cn(
				"flex w-full cursor-pointer items-center justify-start border px-2.5 py-2 text-left text-xs outline-none transition-colors",
				/* Соседние строки: общая линия 1px, без «двойной» границы */
				"border-border/40 not-first:-mt-px hover:z-10 hover:border-border/55",
				"hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
				"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				selected && "border-border bg-muted",
				className,
			)}
		>
			{children}
		</button>
	);
}

function clampIndex(index: number, length: number): number {
	if (length <= 0) return -1;
	if (index < 0) return 0;
	if (index >= length) return length - 1;
	return index;
}

export function ListBox<T>({
	items,
	selectedIndex,
	defaultSelectedIndex = null,
	onSelect,
	getItemKey,
	renderItem,
	disabled = false,
	className,
	itemClassName,
	ariaLabel = "ListBox",
}: ListBoxProps<T>) {
	const isControlled = selectedIndex !== undefined;
	const [internalSelectedIndex, setInternalSelectedIndex] = React.useState<
		number | null
	>(defaultSelectedIndex);

	const activeIndex = isControlled
		? (selectedIndex ?? null)
		: internalSelectedIndex;

	React.useEffect(() => {
		if (isControlled || internalSelectedIndex === null) return;
		if (items.length === 0) return;
		setInternalSelectedIndex((prev) => {
			if (prev === null) return prev;
			return clampIndex(prev, items.length);
		});
	}, [internalSelectedIndex, isControlled, items.length]);

	const selectByIndex = React.useCallback(
		(index: number) => {
			if (disabled || items.length === 0) return;

			const safeIndex = clampIndex(index, items.length);
			if (safeIndex < 0) return;

			if (!isControlled) {
				setInternalSelectedIndex(safeIndex);
			}

			const item = items[safeIndex];
			if (item !== undefined) {
				onSelect?.(item, safeIndex);
			}
		},
		[disabled, isControlled, items, onSelect],
	);

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (disabled || items.length === 0) return;

		const current = activeIndex ?? -1;

		if (event.key === "ArrowDown") {
			event.preventDefault();
			const next = current < 0 ? 0 : clampIndex(current + 1, items.length);
			selectByIndex(next);
			return;
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			const next =
				current < 0 ? items.length - 1 : clampIndex(current - 1, items.length);
			selectByIndex(next);
			return;
		}

		if (event.key === "Enter" || event.key === " ") {
			if (current < 0 || current >= items.length) return;
			event.preventDefault();
			selectByIndex(current);
		}
	};

	return (
		<div
			role="listbox"
			aria-label={ariaLabel}
			aria-disabled={disabled}
			tabIndex={disabled ? -1 : 0}
			onKeyDown={handleKeyDown}
			className={cn(
				"flex min-w-0 flex-col border border-border bg-background",
				className,
			)}
		>
			{items.map((item, index) => {
				const selected = activeIndex === index;
				const content = renderItem
					? renderItem({ item, index, selected })
					: String(item);
				const rowKey = getItemKey ? getItemKey(item, index) : index;

				return (
					<ListBoxItem
						key={rowKey}
						selected={selected}
						disabled={disabled}
						onClick={() => selectByIndex(index)}
						className={itemClassName}
					>
						{content}
					</ListBoxItem>
				);
			})}
		</div>
	);
}

export default ListBox;
