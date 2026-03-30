import type { Plan } from "copymachine-shared";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import ListBox from "#/components/builblocks/ListBox";
import { Button } from "#/components/ui/button";
import { useDirtyMarkStore } from "#/contexts/DirtyMarkContext";
import { usePlanSelectionGuard } from "#/contexts/PlanSelectionGuardContext";
import { useCreatePlanMutation, usePlansQuery } from "#/lib/queries/plans";
import { usePlansStore } from "#/stores/plansStore";

type PlansListProps = {
	plansQueryEnabled: boolean;
};

export default function PlansList({ plansQueryEnabled }: PlansListProps) {
	const navigate = useNavigate();
	const { trySelectPlan } = usePlanSelectionGuard();
	const storePlan = usePlansStore((s) => s.plan);
	const clearPlan = usePlansStore((s) => s.clearPlan);
	const setDirty = useDirtyMarkStore((s) => s.setDirty);
	const createPlanMutation = useCreatePlanMutation();

	const plansQuery = usePlansQuery({ enabled: plansQueryEnabled });

	const plans = plansQuery.data ?? [];
	const selectedPlanIndex = plans.findIndex((p) => p.id === storePlan?.id);

	useEffect(() => {
		const data = plansQuery.data;
		if (data === undefined) {
			return;
		}
		const id = storePlan?.id;
		if (!id) {
			return;
		}
		const exists = data.some((p) => p.id === id);
		if (!exists) {
			clearPlan();
			void navigate({ to: "/plans", search: {}, replace: true });
		}
	}, [plansQuery.data, storePlan?.id, clearPlan, navigate]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: сбрасываем грязь при смене выбранного плана (по id)
	useEffect(() => {
		setDirty(false);
	}, [storePlan?.id, setDirty]);

	return (
		<div className="p-3">
			<div className="mb-2 flex justify-end">
				<Button
					type="button"
					size="icon"
					variant="outline"
					disabled={createPlanMutation.isPending || !plansQueryEnabled}
					onClick={() => createPlanMutation.mutate({ name: "New Plan" })}
					aria-label="Добавить план"
					title="Добавить план"
				>
					<Plus className="size-4" aria-hidden />
				</Button>
			</div>
			{plans.length === 0 ? (
				<p className="text-sm text-(--sea-ink-soft)">Нет ни одного плана.</p>
			) : (
				<ListBox<Plan>
					items={plans}
					selectedIndex={selectedPlanIndex >= 0 ? selectedPlanIndex : null}
					getItemKey={(item, index) => item.id ?? `row-${index}`}
					onSelect={(item) => trySelectPlan(item)}
					ariaLabel="Список планов"
					renderItem={({ item }) => item.name}
				/>
			)}
		</div>
	);
}
