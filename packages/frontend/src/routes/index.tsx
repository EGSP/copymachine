import { createFileRoute, redirect } from "@tanstack/react-router";

type IndexRedirectSearch = {
	planId?: string;
};

// Корень ведёт на приложение планов; query planId сохраняется для старых ссылок /?planId=.
export const Route = createFileRoute("/")({
	validateSearch: (raw: Record<string, unknown>): IndexRedirectSearch => {
		const planId = raw.planId;
		return {
			planId:
				typeof planId === "string" && planId.length > 0 ? planId : undefined,
		};
	},
	beforeLoad: ({ search }) => {
		throw redirect({
			to: "/plans",
			search: search.planId ? { planId: search.planId } : {},
			replace: true,
		});
	},
	component: () => null,
});
