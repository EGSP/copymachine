import type { Schedule } from "#/lib/scheduler/schedule";
import { plansDb } from "../db/db.server";

export type PlanSchedule = {
    planId: string;
    schedule: Schedule;
}

export class PlanScheduler {
    private readonly planSchedules: Map<string, PlanSchedule> = new Map();

    async SyncPlanSchedules() {
        const plans = await plansDb.get();
        for (const plan of plans) {
            if(!plan.id || !plan.schedule) {
                continue;
            }
            this.planSchedules.set(plan.id, {
                planId: plan.id,
                schedule: plan.schedule,
            });
        }
    }

    async tick() {
        
    }
}