export type JobKey = string;

export type JobContext = {
	startedAt: number | undefined;
	endedAt: number | undefined;
	status: "idle" | "running" | "error";
	error: Error | undefined;
} & Record<string, unknown>;

export type JobOptions = {
	jobKey: JobKey;
	jobFn: (ctx: JobContext) => Promise<void>;
	activationFn: (ctx: JobContext) => boolean;
	fillContext?: Record<string, unknown>;
}

export type Job = {
	key: JobKey;
	fn: (ctx: JobContext) => Promise<void>;
	activationFn: (ctx: JobContext) => boolean;
	context: JobContext;
	promise: Promise<unknown> | undefined;
}

function now() {
	return Date.now();
}

function idleContext(): JobContext {
	return { startedAt: undefined, endedAt: undefined, status: "idle", error: undefined };
}

export class JobController {
	private jobs: Map<JobKey, Job> = new Map();

	add(options: JobOptions) {
		this.jobs.set(options.jobKey, {
			key: options.jobKey,
			fn: options.jobFn,
			activationFn: options.activationFn,
			context: {...idleContext(), ...(options.fillContext || {})},
			promise: undefined,
		});
	}

	get(jobKey: JobKey) {
		return this.jobs.get(jobKey);
	}

	remove(jobKey: JobKey) {
		const job = this.jobs.get(jobKey);
		if (job) {
			if (job.context.status === "running")
				throw new Error(`Job ${jobKey} is running`);
		}
		this.jobs.delete(jobKey);
	}

	async tick(): Promise<void> {
		for (const [jobKey, job] of this.jobs.entries()) {
			if (job.promise)
				continue;

			if (job.context.status != "idle")
				continue;

			if (!job.activationFn(job.context))
				continue;

			job.context.startedAt = now();
			job.context.status = "running";
			job.context.error = undefined;
			job.promise = job.fn(job.context);

			job.promise
				.then(() => {
					job.context.endedAt = now();
					job.context.status = "idle";
					job.promise = undefined;
				}).catch((error) => {
					job.context.endedAt = now();
					job.context.status = "error";
					job.context.error = error;
					job.promise = undefined;
				});
		}
	}
}