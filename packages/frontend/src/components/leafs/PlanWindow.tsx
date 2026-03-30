import type { PlanExecution, Schedule } from "copymachine-shared";
import { useEffect, useRef, useState } from "react";
import DirtyMarkBadge from "#/components/builblocks/DirtyMarkBadge";
import Frame from "#/components/builblocks/Frame";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Button } from "#/components/ui/button";
import { useDirtyMarkStore } from "#/contexts/DirtyMarkContext";
import { usePlanSelectionGuard } from "#/contexts/PlanSelectionGuardContext";
import {
	useDeletePlanMutation,
	useUpdatePlanMutation,
} from "#/lib/queries/plans";
import { usePlansStore } from "#/stores/plansStore";
import PlanExecutionView from "./PlanExecutionView";
import ScheduleFrame from "./ScheduleFrame";

export function PlanWindow() {
	const plan = usePlansStore((s) => s.plan);
	const clearPlan = usePlansStore((s) => s.clearPlan);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [executionsDraft, setExecutionsDraft] = useState<PlanExecution[]>([]);
	const setDirty = useDirtyMarkStore((s) => s.setDirty);
	const { pendingTarget, cancelPendingSelection, proceedPendingSelection } =
		usePlanSelectionGuard();
	/** Черновик расписания до сохранения; обновления из ScheduleFrame не вызывают ререндер окна */
	const scheduleDraftRef = useRef<Schedule>({});

	useEffect(() => {
		if (!plan) {
			setDeleteDialogOpen(false);
		}
	}, [plan]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: сброс черновика только при смене id плана, не при каждом обновлении объекта plan
	useEffect(() => {
		if (!plan) {
			return;
		}
		// Только смена плана; иначе несохранённый черновик затёр бы новым объектом plan из стора
		scheduleDraftRef.current = plan.schedule ? { ...plan.schedule } : {};
		setExecutionsDraft(
			plan.executions
			? plan.executions.map((execution) => ({ ...execution }))
			: [],
		);
	}, [plan?.id]);

	const updateMutation = useUpdatePlanMutation();

	const deleteMutation = useDeletePlanMutation();

	if (!plan) {
		return null;
	}

	const planId = plan.id;
	const executionsToRender = executionsDraft;

	return (
		<div className="p-3">
			<div className="mb-3 flex flex-wrap items-center gap-2">
				<DirtyMarkBadge />
				<Button
					variant="outline"
					type="button"
					disabled={!planId || updateMutation.isPending}
					onClick={() =>
						updateMutation.mutate(
							{
								...plan,
								schedule: scheduleDraftRef.current,
								executions: executionsDraft,
							},
							{ onSuccess: () => setDirty(false) },
						)
					}
				>
					Сохранить
				</Button>
				<Button
					variant="destructive"
					type="button"
					disabled={!planId || deleteMutation.isPending}
					onClick={() => setDeleteDialogOpen(true)}
				>
					Удалить
				</Button>
			</div>
			<AlertDialog
				open={pendingTarget !== null}
				onOpenChange={(open) => {
					if (!open) {
						cancelPendingSelection();
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Несохранённые изменения</AlertDialogTitle>
						<AlertDialogDescription>
							Расписание плана «{plan.name ?? "без названия"}» изменено. Перейти
							к плану «{pendingTarget?.name ?? "другой план"}» без сохранения?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel type="button" variant={"default"}>
							Вернуться
						</AlertDialogCancel>
						<Button
							type="button"
							variant={"destructive"}
							onClick={proceedPendingSelection}
						>
							Продолжить
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Удалить план?</AlertDialogTitle>
						<AlertDialogDescription>
							План «{plan.name ?? "без названия"}» будет удалён без возможности
							восстановления.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel type="button">Отмена</AlertDialogCancel>
						<Button
							variant="destructive"
							type="button"
							disabled={deleteMutation.isPending}
							onClick={() => {
								if (planId) {
									deleteMutation.mutate(planId, {
										onSuccess: () => {
											clearPlan();
											setDeleteDialogOpen(false);
										},
									});
								}
							}}
						>
							Удалить
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<p className="text-sm text-(--sea-ink)">
				План: {plan.name}, ID: {plan.id ?? "нет id"}
			</p>
			<ScheduleFrame
				key={plan.id ?? "new-plan"}
				schedule={plan.schedule}
				onScheduleChange={(s) => {
					scheduleDraftRef.current = s;
					setDirty(true);
				}}
			/>
			<Frame label="Список исполнений" className="mt-3">
				{executionsToRender.length > 0 ? (
					executionsToRender.map((execution, index) => (
						<PlanExecutionView
							key={`${execution.startedAt ?? "none"}-${index}`}
							index={index}
							execution={execution}
							onExecutionChange={(updatedExecution) => {
								setExecutionsDraft((currentExecutions) =>
									currentExecutions.map((item, itemIndex) =>
										itemIndex === index ? updatedExecution : item,
									),
								);
								setDirty(true);
							}}
						/>
					))
				) : (
					<p className="text-xs text-muted-foreground">Неизвестно</p>
				)}
			</Frame>
		</div>
	);
}
