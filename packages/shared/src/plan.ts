import type { PathInfo } from "./files.js";
import type { Schedule } from "./schedule.js";

export type Plan = {
	id?: string;
	name?: string;
	versionTimestamp?: number;
	source?: PathInfo;
	target?: PathInfo;
	/** Расписание запуска плана */
	schedule?: Schedule;
	executions?: PlanExecution[];
};


export type PlanExecutionTag = "accepted";

export type PlanExecution = {
	startedAt?: number | undefined,
	endedAt?: number | undefined,
	status?: "running" | "finished" | "error",
	errors?: string[] | undefined,
	tags?: PlanExecutionTag[] | undefined,
}