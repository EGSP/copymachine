import type { Plan } from "./plan.js";
import type { Time } from "./time.js";

export type Schedule = {
	time?: Time | string;
};

export type ScheduleReadyForScheduling = Schedule & {
	time: NonNullable<Schedule["time"]>;
};

export type PlanReadyForScheduling = Plan & {
	id: string;
	source: NonNullable<Plan["source"]>;
	target: NonNullable<Plan["target"]>;
	schedule: ScheduleReadyForScheduling;
};