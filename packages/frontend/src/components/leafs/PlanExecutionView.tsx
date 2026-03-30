import ErrorRow from "#/components/builblocks/ErrorRow";
import type { PlanExecution } from "copymachine-shared";
import Frame from "#/components/builblocks/Frame";
import { Checkbox } from "#/components/ui/checkbox";
import { Field, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";

type PlanExecutionViewProps = {
	execution?: PlanExecution;
	index: number;
	onExecutionChange?: (execution: PlanExecution) => void;
};

function formatTimestamp(value: number | undefined): string {
	if (value === undefined) {
		return "";
	}
	return new Date(value).toLocaleString("ru-RU");
}

export default function PlanExecutionView({
	execution,
	index,
	onExecutionChange,
}: PlanExecutionViewProps) {
	const errors = execution?.errors ?? [];
	const tags = execution?.tags ?? [];
	const isAccepted = tags.includes("accepted");
	const tagsText = tags.length > 0 ? tags.join(", ") : "Неизвестно";

	return (
		<Frame label={`Исполнение #${index + 1}`} className="mt-2">
			<Frame>
				<Field>
					<FieldLabel>Время старта</FieldLabel>
					<Input
						readOnly
						value={formatTimestamp(execution?.startedAt)}
						placeholder="Неизвестно"
						aria-label={`Время старта исполнения ${index + 1}`}
					/>
				</Field>
				<Field>
					<FieldLabel>Время окончания</FieldLabel>
					<Input
						readOnly
						value={formatTimestamp(execution?.endedAt)}
						placeholder="Неизвестно"
						aria-label={`Время окончания исполнения ${index + 1}`}
					/>
				</Field>
				<Field>
					<FieldLabel>Статус</FieldLabel>
					<Input
						readOnly
						value={execution?.status ?? ""}
						placeholder="Неизвестно"
						aria-label={`Статус исполнения ${index + 1}`}
					/>
				</Field>
				<p className="text-xs text-(--sea-ink)">Теги: {tagsText}</p>
			</Frame>
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
					<div className="flex min-w-0 flex-col gap-2">
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
					<Input
						readOnly
						value=""
						placeholder="Неизвестно"
						aria-label={`Ошибки исполнения ${index + 1}`}
					/>
				)}
			</Frame>
		</Frame>
	);
}
