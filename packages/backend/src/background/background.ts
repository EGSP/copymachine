import { JobController } from "../lib/job-controller";
import { PlanScheduler } from "./plans/planScheduler";
import { Ticker } from "./ticker";


const ticker = new Ticker(1000);
const longTicker = new Ticker(10000);

const jobs = new JobController();
const jobControllerKey = "jobController";

const planScheduler = new PlanScheduler();
const planScheduleKey = "planSchedule";

export async function startBackground() {

    ticker.add({
        id: () => jobControllerKey,
        tick: async () => await jobs.tick(),
    });
    longTicker.add({
        id: () => planScheduleKey,
        tick: async () => await planScheduler.tick(),
    });

    await ticker.start();
    await longTicker.start();
}

export function getJobController() {
    return jobs;
}

export function getPlanScheduler() {
    return planScheduler;
}
