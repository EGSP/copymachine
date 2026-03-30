import { PlanScheduler } from "./planScheduler";
import { Ticker } from "./ticker";


const ticker = new Ticker(1000);
const longTicker = new Ticker(10000);

const planScheduler = new PlanScheduler();
const planScheduleKey = "planSchedule";

export async function startBackground() {

    longTicker.add({
        id: () => planScheduleKey,
        tick: async () => await planScheduler.tick(),
    });

    await ticker.start();
    await longTicker.start();
}

export function getPlanScheduler() {
    return planScheduler;
}
