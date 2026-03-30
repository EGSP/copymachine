import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { usePlansStore } from "#/stores/plansStore";
import { CalendarCog, Settings } from "lucide-react";

/** Вкладки «Планы» и «Настройки» — всегда видны, переключают маршруты. */
export function AppMainTabs() {
	const navigate = useNavigate();
	const pathname = useRouterState({
		select: (s) => s.location.pathname,
	});
	const value = pathname.startsWith("/settings") ? "settings" : "plans";

	return (
		<Tabs
			value={value}
			onValueChange={(next) => {
				if (next === "settings") {
					void navigate({ to: "/settings" });
					return;
				}
				const planId = usePlansStore.getState().plan?.id;
				void navigate({
					to: "/plans",
					search: planId ? { planId } : {},
				});
			}}
		>
			<TabsList
				variant={"default"}
				className="min-w-0 justify-start"
			>
				<TabsTrigger value="plans">
					<CalendarCog aria-hidden />
					Планы
				</TabsTrigger>
				<TabsTrigger value="settings">
					<Settings aria-hidden />
					Настройки
				</TabsTrigger>
			</TabsList>
		</Tabs>
	);
}
