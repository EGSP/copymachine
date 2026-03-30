import { createFileRoute } from "@tanstack/react-router";
import PlansFrame from "#/components/leafs/PlansFrame";
import { useBackendHealthQuery } from "#/lib/queries/backend";

export const Route = createFileRoute("/plans/")({
	component: PlansIndexPage,
});

function PlansIndexPage() {
	const healthQuery = useBackendHealthQuery({ retry: 2 });

	return (
		<main className="">
			<PlansFrame plansQueryEnabled={healthQuery.isSuccess} />
		</main>
	);
}
