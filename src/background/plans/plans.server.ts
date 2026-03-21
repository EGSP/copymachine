import { copy } from "#/actions/copy/copy.server";
import type { Plan } from "./plans";

export class PlanJob {
    plan: Plan;
    constructor(plan: Plan) {
        this.plan = plan;
    }

    async execute() {
        await copy(this.plan.source.path, this.plan.target.path);
    }
}