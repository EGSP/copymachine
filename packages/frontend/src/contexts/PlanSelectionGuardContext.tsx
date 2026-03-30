import { getRouteApi, useNavigate } from "@tanstack/react-router";
import {
	createContext,
	useCallback,
	useContext,
	useState,
	type ReactNode,
} from "react";
import type { Plan } from "copymachine-shared";
import { useDirtyMarkStore } from "#/contexts/DirtyMarkContext";
import { usePlansStore } from "#/stores/plansStore";

const plansRouteApi = getRouteApi("/plans");
const PLANS_TO = "/plans" as const;

type PlanSelectionGuardState = {
	/** Смена выбранного плана с учётом несохранённых правок */
	trySelectPlan: (plan: Plan) => void;
	/** План, на который пользователь хотел перейти (пока открыто подтверждение) */
	pendingTarget: Plan | null;
	cancelPendingSelection: () => void;
	proceedPendingSelection: () => void;
};

const PlanSelectionGuardContext = createContext<PlanSelectionGuardState | null>(
	null,
);

export function PlanSelectionGuardProvider({ children }: { children: ReactNode }) {
	const navigate = useNavigate();
	const { planId: searchPlanId } = plansRouteApi.useSearch();
	const getDirty = useDirtyMarkStore((s) => s.getDirty);
	const [pendingTarget, setPendingTarget] = useState<Plan | null>(null);

	const cancelPendingSelection = useCallback(() => {
		setPendingTarget(null);
	}, []);

	const proceedPendingSelection = useCallback(() => {
		setPendingTarget((target) => {
			if (target) {
				void navigate({
					to: PLANS_TO,
					search: target.id ? { planId: target.id } : {},
				});
			}
			return null;
		});
	}, [navigate]);

	const trySelectPlan = useCallback(
		(plan: Plan) => {
			const current = usePlansStore.getState().plan;
			if (current?.id === plan.id && searchPlanId === plan.id) {
				return;
			}
			if (!getDirty()) {
				void navigate({
					to: PLANS_TO,
					search: plan.id ? { planId: plan.id } : {},
				});
				return;
			}
			setPendingTarget(plan);
		},
		[getDirty, navigate, searchPlanId],
	);

	return (
		<PlanSelectionGuardContext.Provider
			value={{
				trySelectPlan,
				pendingTarget,
				cancelPendingSelection,
				proceedPendingSelection,
			}}
		>
			{children}
		</PlanSelectionGuardContext.Provider>
	);
}

export function usePlanSelectionGuard(): PlanSelectionGuardState {
	const ctx = useContext(PlanSelectionGuardContext);
	if (!ctx) {
		throw new Error(
			"usePlanSelectionGuard нужно вызывать внутри PlanSelectionGuardProvider",
		);
	}
	return ctx;
}
