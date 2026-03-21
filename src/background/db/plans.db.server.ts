import path from "node:path";
import { randomUUID } from "node:crypto";
import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import type { Plan } from "#/background/plans/plans";
import { dbDirectory } from "#/background/db/db.server";

export type PlansDbData = {
	plans: Plan[];
};

export class PlansDB {
	private readonly dbFilePath: string;
	private lowDb?: Promise<Low<PlansDbData>>;
	private dbReady?: Promise<Low<PlansDbData>>;

	constructor(dbName: string) {
		this.dbFilePath = path.join(dbDirectory, `${dbName}.db.json`);
	}

	private get db() {
		if (this.lowDb) {
			return this.lowDb;
		}

		this.lowDb = JSONFilePreset<PlansDbData>(
			this.dbFilePath,
			{ plans: [] },
		);
		return this.lowDb;
	}

	private ensurePlanId(plan: Plan): Plan {
		if (plan.id) {
			return plan;
		}

		return {
			...plan,
			id: randomUUID(),
		};
	}

	private async ensureDbInitialized() {
		if (this.dbReady) {
			return this.dbReady;
		}

		this.dbReady = (async () => {
			const db = await this.db;
			let hasChanges = false;

			const plansWithId = db.data.plans.map((plan) => {
				const nextPlan = this.ensurePlanId(plan);
				if (nextPlan.id !== plan.id) {
					hasChanges = true;
				}
				return nextPlan;
			});

			if (hasChanges) {
				await db.update((data) => {
					data.plans = plansWithId;
				});
			}

			return db;
		})();

		return this.dbReady;
	}

	async get() {
		const db = await this.ensureDbInitialized();
		return db.data.plans;
	}

	async create(plan: Plan) {
		const db = await this.ensureDbInitialized();
		const planWithId = this.ensurePlanId(plan);
		await db.update(({ plans }) => {
			plans.push(planWithId);
		});
	}

	async update(plan: Plan) {
		const db = await this.ensureDbInitialized();
		const planWithId = this.ensurePlanId(plan);
		const planIndex = db.data.plans.findIndex((item) => item.id === planWithId.id);
		if (planIndex === -1) {
			return;
		}

		await db.update((data) => {
			data.plans[planIndex] = planWithId;
		});
	}
}
