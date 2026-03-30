import { toCurrentDate, type PathInfo, type Plan, type PlanExecution, type PlanReadyForScheduling, type Schedule, type ScheduleReadyForScheduling, type Time } from "copymachine-shared";
import { plansDb } from "../db/instance.js";
import { setTimeout } from "node:timers/promises";

export class PlanScheduler {

	private readonly planJobs: Map<string, PlanJob> = new Map();

	async tick() {
		const plans = await plansDb.get();

		for (const plan of plans) {
			const check = this.validatePlan(plan);
			if (!check.ok) {
				console.warn(`Plan ${plan.id} is invalid: ${check.errors.join(", ")}`);
				continue;
			}
			const checkedPlan = check.plan;

			const planJob = this.planJobs.get(checkedPlan.id);
			if (planJob) {
				if (planJob.shouldRun()) {
					await this.runPlan(planJob);
				}
				continue;
			}

			const executions = checkedPlan.executions;
			const recentExecution = executions?.at(-1);

			if (recentExecution) {
				if (recentExecution.status === "running") {
					continue;
				}

				if (recentExecution.status === "error" && !recentExecution.tags?.includes('accepted')) {
					continue;
				}
			}

			await this.addPlan(checkedPlan);
		}
	}

	private async addPlan(plan: PlanReadyForScheduling): Promise<void> {
		if (this.planJobs.has(plan.id)) {
			throw new Error(`Plan ${plan.id} already has a job`);
		}
		const planJob = new PlanJob(plan);
		this.planJobs.set(plan.id, planJob);
	}

	private async runPlan(planJob: PlanJob): Promise<void> {
		planJob.run()
			.catch((error) => {
				console.error(`Plan ${planJob.cachedPlan.name} - (${planJob.cachedPlan.id}) failed: ${error instanceof Error ? error.message : String(error)}`);
			})
			.finally(() => {
				this.planJobs.delete(planJob.cachedPlan.id);
			});
	}

	/**
	 * Проверяет, что план имеет все необходимые свойства.
	 * @param plan - План.
	 * @returns {{ ok: true, plan: PlanReadyForScheduling }} Если план имеет все необходимые свойства.
	 * @returns {{ ok: false, errors: string[] }} Если план не имеет всех необходимых свойств
	 */
	validatePlan(plan: Plan): { ok: true, plan: PlanReadyForScheduling }
		| { ok: false, errors: string[] } {
		const errors: string[] = [];

		if (!plan.id) errors.push("Plan ID is required");
		if (!plan.schedule) {
			errors.push("Plan schedule is required");
		} else {
			const checkedSchedule = this.validateSchedule(plan.schedule);
			if (!checkedSchedule.ok)
				errors.push(...checkedSchedule.errors);
		}
		if (!plan.source) errors.push("Plan source is required");
		if (!plan.target) errors.push("Plan target is required");

		if (errors.length > 0)
			return { ok: false, errors };

		return {
			ok: true, plan: {
				...plan,
				id: plan.id!,
				schedule: plan.schedule as ScheduleReadyForScheduling,
				source: plan.source!,
				target: plan.target!,
			}
		};
	}

	validateSchedule(schedule: Schedule): { ok: true, schedule: ScheduleReadyForScheduling }
		| { ok: false, errors: string[] } {
		const errors: string[] = [];
		if (!schedule.time)
			errors.push("Schedule time is required");
		if (errors.length > 0)
			return { ok: false, errors };
		return { ok: true, schedule: { ...schedule, time: schedule.time! } };
	}
}


export class PlanJob {
	readonly cachedPlan: PlanReadyForScheduling;
	private execution?: PlanExecution | undefined;

	constructor(plan: PlanReadyForScheduling) {
		this.cachedPlan = plan;
	}

	async run(): Promise<void> {
		console.log(`Job ${this.cachedPlan.name} - (${this.cachedPlan.id}) started`);
		this.execution = {
			startedAt: Date.now(),
			status: "running",
		};
		await plansDb.update({
			...this.cachedPlan,
			executions: [...this.cachedPlan.executions ?? [], this.execution],
		});

		try {
			await setTimeout(10 * 1000);
			throw new Error("Not implemented");
		} catch (error) {
			this.execution.endedAt = Date.now();
			this.execution.status = "error";
			this.execution.errors = [error instanceof Error ? error.message : String(error)];

			await plansDb.update({
				...this.cachedPlan,
				executions: [...this.cachedPlan.executions ?? [], this.execution],
			});
			throw error;
		}

		console.log(`Job ${this.cachedPlan.id} finished`);
		this.execution!.endedAt = Date.now();
		this.execution!.status = "finished";
		await plansDb.update({
			...this.cachedPlan,
			executions: [...this.cachedPlan.executions ?? [], this.execution!],
		});
	}

	shouldRun(): boolean {
		const schedule = this.cachedPlan.schedule;

		const now = new Date();
		const time = schedule.time as Time;

		// TODO: проверить что в текущем дне не было именно запуска execution.

		const timeDate = toCurrentDate(time);
		if (now >= timeDate) {
			console.log(`Plan ${this.cachedPlan.name} - (${this.cachedPlan.id}) should run`);
			return true;
		}

		return false;
	}
}
