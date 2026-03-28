import type { PathInfo } from "./files.js";
import type { Schedule } from "./schedule.js";

export type Plan = {
	id?: string;
	name?: string;
	source?: PathInfo;
	target?: PathInfo;
	/** Расписание запуска плана */
	schedule?: Schedule;
};
