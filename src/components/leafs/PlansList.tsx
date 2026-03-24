import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getPlans } from "#/actions/plans.functions";
import type { Plan } from "#/background/plans/plans";
import ListBox from "#/components/builblocks/ListBox";
import { useDirtyMarkStore } from "#/contexts/DirtyMarkContext";
import { plansQueryKey } from "#/lib/plansQuery";
import { usePlansStore } from "#/stores/plansStore";

type PlansListProps = {
	plansQueryEnabled: boolean;
};

export default function PlansList({ plansQueryEnabled }: PlansListProps) {
	const setPlan = usePlansStore((s) => s.setPlan);
	const storePlan = usePlansStore((s) => s.plan);
	const clearPlan = usePlansStore((s) => s.clearPlan);
	const setDirty = useDirtyMarkStore((s) => s.setDirty);

	const plansQuery = useQuery({
		queryKey: plansQueryKey,
		queryFn: () => getPlans(),
		enabled: plansQueryEnabled,
	});

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
					onSelect={(item) => setPlan(item)}
					ariaLabel="Список планов"
					renderItem={({ item }) => item.name}
				/>
			)}
		</div>
	);
}
