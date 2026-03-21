import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { Low } from "lowdb";
import { JSONFilePreset } from "lowdb/node";
import type { Plan } from "#/background/plans/plans";
import { dbDirectory } from "#/background/db/db.server";

export type PlansDbData = {
	plans: Plan[];
};

export class PlansDB {
	private readonly dbFilePath: string;
	private lowDb?: Low<PlansDbData>;
	private initInFlight?: Promise<Low<PlansDbData>>;

	constructor(dbName: string) {
		this.dbFilePath = path.join(dbDirectory, `${dbName}.db.json`);
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

	async init() {
		if (this.lowDb) {
			return this.lowDb;
		}

		if (this.initInFlight) {
			return this.initInFlight;
		}

		this.initInFlight = (async () => {
			await mkdir(path.dirname(this.dbFilePath), { recursive: true });

			const db = await JSONFilePreset<PlansDbData>(
				this.dbFilePath,
				{ plans: [] },
			);
			await db.read();
			await db.update((data) => {
				for (let i = 0; i < data.plans.length; i += 1) {
					data.plans[i] = this.ensurePlanId(data.plans[i]);
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

	async create(plan: Plan) {
		const db = await this.getDb();
		const planWithId = this.ensurePlanId(plan);
		await db.update(({ plans }) => {
			plans.push(planWithId);
		});
	}

	async update(plan: Plan) {
		const db = await this.getDb();
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
