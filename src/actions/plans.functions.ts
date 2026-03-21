import { createServerFn } from "@tanstack/react-start";
import type { Plan } from "#/background/plans/plans";
import { plansDb } from "#/background/db/db.server";

export const getPlans = createServerFn({ method: "GET" }).handler(async () => {
	return plansDb.get();
});

export const createPlan = createServerFn({ method: "POST" })
	.inputValidator((data: Plan) => data)
	.handler(async ({ data }) => {
		await plansDb.create(data);
	});

export const updatePlan = createServerFn({ method: "POST" })
	.inputValidator((data: Plan) => data)
	.handler(async ({ data }) => {
		await plansDb.update(data);
	});
