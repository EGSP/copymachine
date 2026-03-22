import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPlans } from "#/actions/plans.functions";
import ListBox from "#/components/builblocks/ListBox";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "#/components/ui/resizable";

export const plansQueryKey = ["plans"] as const;

type PlansListProps = {
	plansQueryEnabled: boolean;
};

export default function PlansList({ plansQueryEnabled }: PlansListProps) {
	const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

	const plansQuery = useQuery({
		queryKey: plansQueryKey,
		queryFn: () => getPlans(),
		enabled: plansQueryEnabled,
	});

	const plans = plansQuery.data ?? [];
	const selectedPlan = plans.find((plan) => plan.id === selectedPlanId);
	const selectedPlanIndex = plans.findIndex(
		(plan) => plan.id === selectedPlanId,
	);

	return (
		<ResizablePanelGroup orientation="horizontal">
			<ResizablePanel defaultSize={"21%"}>
				<div className="p-3">
					{plans.length === 0 ? (
						<p className="text-sm text-(--sea-ink-soft)">
							Нет ни одного плана.
						</p>
					) : (
						<ListBox
							items={plans}
							selectedIndex={selectedPlanIndex >= 0 ? selectedPlanIndex : null}
							onSelect={(item) => setSelectedPlanId(item.id ?? null)}
							ariaLabel="Список планов"
							renderItem={({ item }) => item.name}
						/>
					)}
				</div>
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel>
				<div className="p-3">
					{selectedPlan ? (
						<p className="text-sm text-(--sea-ink)">
							План: {selectedPlan.name}, ID: {selectedPlan.id ?? "нет id"}
						</p>
					) : (
						<p className="text-sm text-(--sea-ink-soft)">
							Выберите план, чтобы увидеть его название и ID.
						</p>
					)}
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
