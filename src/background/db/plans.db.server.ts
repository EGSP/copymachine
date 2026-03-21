import path from "node:path";
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

	async get() {
		const db = await this.db;
		return db.data.plans;
	}

	async save(plan: Plan) {
		const db = await this.db;
		await db.update(({ plans }) => {
			plans.push(plan);
		});
	}

	async update(plan: Plan) {
		const db = await this.db;
		const planIndex = db.data.plans.findIndex((item) => item.id === plan.id);
		if (planIndex === -1) {
			return;
		}

		await db.update((data) => {
			data.plans[planIndex] = plan;
		});
	}
}
