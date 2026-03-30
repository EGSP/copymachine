import ErrorRow from "#/components/builblocks/ErrorRow";
import type { PlanExecution } from "copymachine-shared";
import { Activity, Bug, ChevronDown, Timer, TimerOff } from "lucide-react";
import Frame from "#/components/builblocks/Frame";
import { Checkbox } from "#/components/ui/checkbox";
import { Badge } from "#/components/ui/badge";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible";

type PlanExecutionViewProps = {
	execution?: PlanExecution;
	index: number;
	defaultOpen?: boolean;
	onExecutionChange?: (execution: PlanExecution) => void;
};

function formatTimestamp(value: number | undefined): string {
	if (value === undefined) {
		return "...";
	}
	return new Date(value).toLocaleString("ru-RU");
}

function formatStatus(value: PlanExecution["status"]): string {
	return value ?? "...";
}

export default function PlanExecutionView({
	execution,
	index,
	defaultOpen = false,
	onExecutionChange,
}: PlanExecutionViewProps) {
	const errors = execution?.errors ?? [];
	const tags = execution?.tags ?? [];
	const isAccepted = tags.includes("accepted");

	return (
		<Collapsible defaultOpen={defaultOpen}>
			<Frame className="mt-2">
				<CollapsibleTrigger
					className="flex w-full flex-wrap items-center gap-2 text-left"
					aria-label={`Раскрыть исполнение ${index + 1}`}
				>
					<Badge variant="outline">
						<Timer aria-hidden />
						{formatTimestamp(execution?.startedAt)}
					</Badge>
					<Badge variant="outline">
						<TimerOff aria-hidden />
						{formatTimestamp(execution?.endedAt)}
					</Badge>
					<Badge variant="outline">
						<Activity aria-hidden />
						{formatStatus(execution?.status)}
					</Badge>
					{errors.length > 0 ? (
						<Badge variant="outline">
							<Bug aria-hidden />
							{errors.length}
						</Badge>
					) : null}
					<ChevronDown className="ml-auto size-4 opacity-70" aria-hidden />
				</CollapsibleTrigger>
				<CollapsibleContent className="mt-3">
					<Frame label="Ошибки">
						{errors.length > 0 ? (
							<label className="flex items-center gap-2 text-xs text-(--sea-ink)">
								<Checkbox
									checked={isAccepted}
									onChange={(event) => {
										const updatedTags = event.currentTarget.checked
											? [...tags, "accepted" as const]
											: tags.filter((tag) => tag !== "accepted");
										onExecutionChange?.({
											...(execution ?? {}),
											tags: updatedTags.length > 0 ? updatedTags : undefined,
										});
									}}
								/>
								Проверено
							</label>
						) : null}
						{errors.length > 0 ? (
							<div className="mt-2 flex min-w-0 flex-col gap-2">
								{errors.map((error, errorIndex) => (
									<ErrorRow
										key={`${error}-${errorIndex}`}
										label={`Ошибка ${errorIndex + 1}:`}
										text={error}
										muted={isAccepted}
									/>
								))}
							</div>
						) : (
							<p className="text-xs text-muted-foreground">...</p>
						)}
					</Frame>
				</CollapsibleContent>
			</Frame>
		</Collapsible>
	);
}
