import type { PathInfo } from "#/lib/files/files";
import type { Schedule } from "#/lib/scheduler/schedule";

export type Plan = {
    id?: string;
    name?: string;

    source?: PathInfo;
    target?: PathInfo;
    /** Расписание запуска плана */
    schedule?: Schedule;
};