import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import type { Plan } from "copymachine-shared";
import { dbDirectory } from "./paths.js";

export type PlansDbData = {
	plans: Plan[];
};

export class PlansDB {
	private readonly dbFilePath: string;
	private lowDb?: Low<PlansDbData>;
	private initInFlight?: Promise<Low<PlansDbData>>;

	constructor(dbName: string) {
		this.dbFilePath = path.join(dbDirectory, `${dbName}.db.json`);
		console.log(this.dbFilePath);
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

	private ensureVersion(plan: Plan): Plan {
		if (plan.versionTimestamp !== undefined) {
			return plan;
		}

		return {
			...plan,
			versionTimestamp: Date.now(),
		};
	}

	private withUpdatedVersion(plan: Plan): Plan {
		return {
			...plan,
			versionTimestamp: Date.now(),
		};
	}

	/**
	 * Сортирует execution по startedAt.
	 * Самые новые execution будут в конце массива.
	 */
	private ensureExecutionOrder(plan: Plan): Plan {
		if (plan.executions) {
			plan.executions.sort((a, b) => (a.startedAt ?? 0) - (b.startedAt ?? 0));
		}
		return plan;
	}

	async init() {
		if (this.lowDb) {
			return this.lowDb;
		}

		if (this.initInFlight) {
			return this.initInFlight;
		}

		this.initInFlight = (async () => {
			await mkdir(path.dirname(this.dbFilePath), { recursive: true });

			const db = await JSONFilePreset<PlansDbData>(this.dbFilePath, {
				plans: [],
			});
			await db.read();
			await db.update((data) => {
				for (let i = 0; i < data.plans.length; i += 1) {
					data.plans[i] = this.ensureVersion(
						this.ensureExecutionOrder(
							this.ensurePlanId(data.plans[i])));
				}
			});

			this.lowDb = db;
			return db;
		})().finally(() => {
			this.initInFlight = undefined;
		});

		return this.initInFlight;
	}

	private async getDb() {
		if (this.lowDb) {
			return this.lowDb;
		}

		return this.init();
	}

	async get() {
		const db = await this.getDb();
		return db.data.plans;
	}

	async getById(id: string) {
		const db = await this.getDb();
		return db.data.plans.find((item) => item.id === id);
	}

	async create(plan: Plan) {
		const db = await this.getDb();
		const planWithId = this.withUpdatedVersion(this.ensurePlanId(plan));
		await db.update(({ plans }) => {
			plans.push(planWithId);
		});
	}

	async update(plan: Plan) {
		const db = await this.getDb();
		const validatedPlan = this.withUpdatedVersion(this.ensurePlanId(plan));
		const planIndex = db.data.plans.findIndex((item) => item.id === validatedPlan.id);
		if (planIndex === -1) {
			return;
		}

		await db.update((data) => {
			data.plans[planIndex] = validatedPlan;
		});
	}

	async deleteById(id: string) {
		const db = await this.getDb();
		await db.update((data) => {
			data.plans = data.plans.filter((item) => item.id !== id);
		});
	}
}
