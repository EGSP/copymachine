import type { Plan, Schedule } from "copymachine-shared";
import { plansDb } from "../../db/instance.js";

export type PlanSchedule = {
	planId: string;
	schedule: Schedule;
};

export class PlanScheduler {
	/**
	 * Расписания планов.
	 * Используется только для запуска планов.
	 */
	private readonly plansSchedules: Map<string, PlanSchedule> = new Map();

	/**
	 * Синхронизирует расписания с переданным списком планов.
	 */
	syncFromPlans(plans: Plan[]) {
		for (const plan of plans) {
			if (!plan.id || !plan.schedule) {
				continue;
			}
			this.plansSchedules.set(plan.id, {
				planId: plan.id,
				schedule: plan.schedule,
			});
		}
	}

	/**
	 * Синхронизирует расписания с базой планов.
	 */
	async syncFromDb() {
		const plans = await plansDb.get();
		this.syncFromPlans(plans);
	}

	async tick() {
		// Зарезервировано под запуск по расписанию
	}
}
