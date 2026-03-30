import {
	createFileRoute,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useBackendHealthQuery } from "#/lib/queries/backend";
import { usePlansQuery } from "#/lib/queries/plans";
import { usePlansStore } from "#/stores/plansStore";

export type PlansSearch = {
	planId?: string;
};

// Layout: валидация search и синхронизация planId ↔ стор для всей ветки /plans.
// Контент главного экрана — в `index.tsx` (дочерний маршрут).
export const Route = createFileRoute("/plans")({
	validateSearch: (raw: Record<string, unknown>): PlansSearch => {
		const planId = raw.planId;
		return {
			planId:
				typeof planId === "string" && planId.length > 0 ? planId : undefined,
		};
	},
	component: PlansLayout,
});

function PlansLayout() {
	const { planId } = Route.useSearch();
	const navigate = useNavigate();
	const healthQuery = useBackendHealthQuery({ retry: 2 });
	const plansQuery = usePlansQuery({ enabled: healthQuery.isSuccess });

	// Выбранный план следует за planId в URL (в т.ч. назад/вперёд и перезагрузка).
	useEffect(() => {
		if (plansQuery.data === undefined) {
			return;
		}
		if (!planId) {
			usePlansStore.getState().clearPlan();
			return;
		}
		const plan = plansQuery.data.find((p) => p.id === planId);
		if (plan) {
			const cur = usePlansStore.getState().plan;
			if (cur?.id !== planId) {
				usePlansStore.getState().setPlan(plan);
			}
		} else {
			void navigate({ to: "/plans", search: {}, replace: true });
			usePlansStore.getState().clearPlan();
		}
	}, [plansQuery.data, planId, navigate]);

	if (healthQuery.isPending) {
		return (
			<p className="text-sm text-(--sea-ink-soft)">Подключение к бэкенду…</p>
		);
	}

	if (healthQuery.isError) {
		return <p>Бэкенд недоступен (проверь URL и что сервер запущен).</p>;
	}

	return <Outlet />;
}
