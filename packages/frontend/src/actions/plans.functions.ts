import { createServerFn } from "@tanstack/react-start";
import { plansDb } from "#/background/db/db.server";
import type { Plan } from "#/background/plans/plans";

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

export const deletePlan = createServerFn({ method: "POST" })
	.inputValidator((data: { id: string }) => data)
	.handler(async ({ data }) => {
		await plansDb.deleteById(data.id);
	});
