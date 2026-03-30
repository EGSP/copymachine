import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

type FrameProps = {
	label?: string;
	children: ReactNode;
	className?: string;
	contentClassName?: string;
};

export default function Frame({
	label,
	children,
	className,
	contentClassName,
}: FrameProps) {
	return (
		<section className={cn("flex min-w-0 flex-col gap-2 border border-border p-2", className)}>
			{label ? <p className="text-xs text-muted-foreground">{label}</p> : null}
			<div className={cn("flex min-w-0 flex-col gap-2", contentClassName)}>{children}</div>
		</section>
	);
}
