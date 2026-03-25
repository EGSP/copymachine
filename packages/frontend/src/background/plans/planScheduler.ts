import type { Schedule } from "#/lib/scheduler/schedule";
import { plansDb } from "../db/db.server";

export type PlanSchedule = {
    planId: string;
    schedule: Schedule;
}

export class PlanScheduler {
    /**
     * Расписания планов.
     * Используется только для запуска планов.
     */
    private readonly plansSchedules: Map<string, PlanSchedule> = new Map();

    /**
     * Синхронизирует расписания планов с базой данных
     */
    async syncPlansSchedules() {
        const plans = await plansDb.get();
        for (const plan of plans) {
            if(!plan.id || !plan.schedule) {
                continue;
            }
            this.plansSchedules.set(plan.id, {
                planId: plan.id,
                schedule: plan.schedule,
            });
        }
    }

    async tick() {
        
    }
}