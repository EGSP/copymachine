import * as React from "react";
import { cn } from "#/lib/utils";

type CheckboxProps = Omit<React.ComponentProps<"input">, "type">;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
	({ className, ...props }, ref) => {
		return (
			<input
				ref={ref}
				type="checkbox"
				data-slot="checkbox"
				className={cn(
					"size-4 shrink-0 rounded-none border border-input bg-transparent align-middle accent-foreground outline-none transition-colors",
					"focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				{...props}
			/>
		);
	},
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
