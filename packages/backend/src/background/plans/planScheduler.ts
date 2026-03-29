import type { PathInfo, Plan, PlanExecution, PlanReadyForScheduling, Schedule, ScheduleReadyForScheduling, Time } from "copymachine-shared";
import { plansDb } from "../../db/instance.js";
import { getJobController } from "../background.js";
import { setTimeout } from "node:timers/promises";

export class PlanScheduler {

	async tick() {
		const plans = await plansDb.get();
		const jobController = getJobController();

		for (const plan of plans) {
			const check = this.precheckPlan(plan);
			if (!check.ok) {
				console.warn(`Plan ${plan.id} is invalid: ${check.errors.join(", ")}`);
				continue;
			}
			const job = jobController.get(check.plan.id);

			// TODO: Job существует и нужно будет обработать результат и запланировать следующий запуск.
			if (job) {
				continue;
			} else {
				jobController.add({
					jobKey: check.plan.id,
					jobFn: async (ctx) => {
						await this.runPlan(ctx.plan as PlanReadyForScheduling);
					},
					activationFn: (ctx) => {
						const plan = ctx.plan as PlanReadyForScheduling;

						return this.shouldRun(plan);
					},
					fillContext: {
						plan: { ...check.plan }
					}
				})
			}

		}
	}

	/** Выполняет один запуск плана (сохранение execution в БД, имитация работы). */
	private async runPlan(plan: PlanReadyForScheduling): Promise<void> {
		let execution: PlanExecution = {
			startedAt: Date.now(),
			status: "running",
		};

		plansDb.update({
			...plan,
			executions: [...plan.executions ?? [], execution],
		});

		try {
			await setTimeout(15 * 1000);
		} catch (error) {
			execution.endedAt = Date.now();
			execution.status = "error";
			execution.errors = [error instanceof Error ? error.message : String(error)];
			plansDb.update({
				...plan,
				executions: [...plan.executions ?? [], execution],
			});
			throw error;
		}
		console.log(`Job ${plan.id} finished`);
		execution.endedAt = Date.now();
		execution.status = "finished";
		plansDb.update({
			...plan,
			executions: [...plan.executions ?? [], execution],
		});
	}

	/**
	 * Проверяет, что план имеет все необходимые свойства.
	 * @param plan - План.
	 * @returns {{ ok: true, plan: PlanReadyForScheduling }} Если план имеет все необходимые свойства.
	 * @returns {{ ok: false, errors: string[] }} Если план не имеет всех необходимых свойств
	 */
	precheckPlan(plan: Plan): { ok: true, plan: PlanReadyForScheduling }
		| { ok: false, errors: string[] } {
		const errors: string[] = [];

		if (!plan.id) errors.push("Plan ID is required");
		if (!plan.schedule) {
			errors.push("Plan schedule is required");
		} else {
			const checkedSchedule = this.precheckSchedule(plan.schedule);
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

	precheckSchedule(schedule: Schedule): { ok: true, schedule: ScheduleReadyForScheduling }
		| { ok: false, errors: string[] } {
		const errors: string[] = [];
		if (!schedule.time)
			errors.push("Schedule time is required");
		if (errors.length > 0)
			return { ok: false, errors };
		return { ok: true, schedule: { ...schedule, time: schedule.time! } };
	}

	shouldRun(plan: PlanReadyForScheduling): boolean {
		const now = new Date();
		const schedule = plan.schedule;

		const time = schedule.time as Time;
		// TODO


		return false;
	}


}
