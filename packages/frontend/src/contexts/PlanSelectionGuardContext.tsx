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
	const getDirty = useDirtyMarkStore((s) => s.getDirty);
	const [pendingTarget, setPendingTarget] = useState<Plan | null>(null);

	const cancelPendingSelection = useCallback(() => {
		setPendingTarget(null);
	}, []);

	const proceedPendingSelection = useCallback(() => {
		setPendingTarget((target) => {
			if (target) {
				usePlansStore.getState().setPlan(target);
			}
			return null;
		});
	}, []);

	const trySelectPlan = useCallback(
		(plan: Plan) => {
			const current = usePlansStore.getState().plan;
			if (current?.id === plan.id) {
				return;
			}
			if (!getDirty()) {
				usePlansStore.getState().setPlan(plan);
				return;
			}
			setPendingTarget(plan);
		},
		[getDirty],
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
