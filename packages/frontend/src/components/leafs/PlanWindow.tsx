import type { Plan, Schedule } from "copymachine-shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import DirtyMarkBadge from "#/components/builblocks/DirtyMarkBadge";
import { Button } from "#/components/ui/button";
import { useDirtyMarkStore } from "#/contexts/DirtyMarkContext";
import { usePlanSelectionGuard } from "#/contexts/PlanSelectionGuardContext";
import { api, treatyData } from "#/lib/api";
import { plansQueryKey } from "#/lib/plansQuery";
import { usePlansStore } from "#/stores/plansStore";
import ScheduleFrame from "./ScheduleFrame";

export function PlanWindow() {
	const plan = usePlansStore((s) => s.plan);
	const clearPlan = usePlansStore((s) => s.clearPlan);
	const queryClient = useQueryClient();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const setDirty = useDirtyMarkStore((s) => s.setDirty);
	const {
		pendingTarget,
		cancelPendingSelection,
		proceedPendingSelection,
	} = usePlanSelectionGuard();
	/** Черновик расписания до сохранения; обновления из ScheduleFrame не вызывают ререндер окна */
	const scheduleDraftRef = useRef<Schedule>({});

	useEffect(() => {
		if (!plan) {
			setDeleteDialogOpen(false);
		}
	}, [plan]);

	useEffect(() => {
		if (!plan) {
			return;
		}
		// Только смена плана; иначе несохранённый черновик затёр бы новым объектом plan из стора
		scheduleDraftRef.current = plan.schedule ? { ...plan.schedule } : {};
	}, [plan?.id]);

	const updateMutation = useMutation({
		mutationFn: (p: Plan) => treatyData(api.api.plans.put(p)),
		onSuccess: () => {
			setDirty(false);
			void queryClient.invalidateQueries({ queryKey: plansQueryKey });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => treatyData(api.api.plans({ id }).delete()),
		onSuccess: () => {
			clearPlan();
			void queryClient.invalidateQueries({ queryKey: plansQueryKey });
			setDeleteDialogOpen(false);
		},
	});

	if (!plan) {
		return null;
	}

	const planId = plan.id;

	return (
		<div className="p-3">
			<div className="mb-3 flex flex-wrap items-center gap-2">
				<DirtyMarkBadge />
				<Button
					variant="outline"
					type="button"
					disabled={!planId || updateMutation.isPending}
					onClick={() =>
						updateMutation.mutate({
							...plan,
							schedule: scheduleDraftRef.current,
						})
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
									deleteMutation.mutate(planId);
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
		</div>
	);
}
