import { cn } from "#/lib/utils";

type ErrorRowProps = {
	label: string;
	text: string;
	muted?: boolean;
	className?: string;
};

export default function ErrorRow({
	label,
	text,
	muted = false,
	className,
}: ErrorRowProps) {
	return (
		<div
			className={cn(
				"grid grid-cols-[7rem_1fr] gap-2 border border-border p-2 text-xs text-destructive",
				muted && "text-muted-foreground",
				className,
			)}
		>
			<span className="font-medium">{label}</span>
			<span className="wrap-break-word">{text}</span>
		</div>
	);
}
