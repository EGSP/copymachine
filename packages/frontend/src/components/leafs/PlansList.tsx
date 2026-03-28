import type { Plan } from "copymachine-shared";
import { useEffect } from "react";
import ListBox from "#/components/builblocks/ListBox";
import { useDirtyMarkStore } from "#/contexts/DirtyMarkContext";
import { usePlanSelectionGuard } from "#/contexts/PlanSelectionGuardContext";
import { usePlansQuery } from "#/lib/queries/plans";
import { usePlansStore } from "#/stores/plansStore";

type PlansListProps = {
	plansQueryEnabled: boolean;
};

export default function PlansList({ plansQueryEnabled }: PlansListProps) {
	const { trySelectPlan } = usePlanSelectionGuard();
	const storePlan = usePlansStore((s) => s.plan);
	const clearPlan = usePlansStore((s) => s.clearPlan);
	const setDirty = useDirtyMarkStore((s) => s.setDirty);

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
		}
	}, [plansQuery.data, storePlan?.id, clearPlan]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: сбрасываем грязь при смене выбранного плана (по id)
	useEffect(() => {
		setDirty(false);
	}, [storePlan?.id, setDirty]);

	return (
		<div className="p-3">
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
