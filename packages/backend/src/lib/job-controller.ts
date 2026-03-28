/**
 * Примитивный job-контроллер (кеш, дедупликация in-flight, подписки, invalidate) для фона на бэкенде.
 *
 * ## Снимок джобы (`getJobState` / аргумент колбэка `subscribe`)
 *
 * Дискриминированный union по **`status`** — в `switch` TypeScript сужает типы:
 *
 * - **`idle`** — `context`, `isStale`
 * - **`pending`** — `context`, `isStale`, опционально `data` / `dataUpdatedAt` с прошлого успеха
 * - **`success`** — `context`, `isStale`, `data`, `dataUpdatedAt`
 * - **`error`** — `context`, `isStale`, `error`, опционально `data` / `dataUpdatedAt` с прошлого успеха
 *
 * ## Поля **context.meta** (заполняет контроллер)
 *
 * - **startedAt**, **endedAt**, **error**, **status**, **dataUpdatedAt**
 *
 * На **ctx** можно вешать свои поля; они живут на экземпляре джобы в кеше.
 *
 * ## Итерация по списку ключей
 *
 * Вынесите список `JobKey` наружу, один раз **`registerJob`** на ключ (jobFn + staleFn), затем в цикле
 * **`tickJob(key)`** — джоба сама решит, нужен ли запуск (как `runJob` без передачи fn).
 */

export type JobKey = readonly unknown[];

export type JobStatus = "idle" | "pending" | "success" | "error";

/** Системные поля контекста; обновляются контроллером при смене состояния и жизненном цикле запуска. */
export type JobMeta = {
	startedAt: number | undefined;
	endedAt: number | undefined;
	error: Error | undefined;
	status: JobStatus;
	dataUpdatedAt: number | undefined;
};

/**
 * Контекст одной джобы в кеше. `meta` — предопределённые поля; остальное — произвольный словарь.
 */
export type JobContext = { meta: JobMeta } & Record<string, unknown>;

export type JobViewIdle = {
	status: "idle";
	isStale: boolean;
	context: JobContext;
};

export type JobViewPending<TData = unknown> = {
	status: "pending";
	isStale: boolean;
	context: JobContext;
	/** Последний успешный результат до текущего запуска, если был. */
	data: TData | undefined;
	dataUpdatedAt: number | undefined;
};

export type JobViewSuccess<TData = unknown> = {
	status: "success";
	isStale: boolean;
	context: JobContext;
	data: TData;
	dataUpdatedAt: number;
};

export type JobViewError<TData = unknown> = {
	status: "error";
	isStale: boolean;
	context: JobContext;
	error: Error;
	/** Последний успех до ошибки, если был. */
	data: TData | undefined;
	dataUpdatedAt: number | undefined;
};

/** Явный снимок для чтения и для подписчика: сужение по `status`. */
export type JobView<TData = unknown> =
	| JobViewIdle
	| JobViewPending<TData>
	| JobViewSuccess<TData>
	| JobViewError<TData>;

export type StaleFn = (ctx: JobContext) => boolean;

export type JobRunOptions<TData> = {
	jobKey: JobKey;
	jobFn: (ctx: JobContext) => Promise<TData>;
	/**
	 * `true` — данные считаются устаревшими и нужен новый запуск (при успешном кеше).
	 * Если не передать — после `success` джоба не устаревает сама, только через `invalidateJobs`.
	 */
	staleFn?: StaleFn;
};

export type JobControllerOptions = {
	/**
	 * Время жизни записи в кеше после того, как на неё никто не подписан (мс).
	 * По умолчанию 5 минут; `Infinity` — не удалять по GC.
	 */
	defaultGcTime?: number;
};

export type TickJobResult<TData = unknown> =
	| { kind: "not_registered" }
	| { kind: "cached"; data: TData }
	| { kind: "completed"; data: TData }
	| { kind: "failed"; error: Error };

type JobListener = (snapshot: JobView<unknown>) => void;

type CacheEntry<TData = unknown> = {
	jobKey: JobKey;
	jobFn: (ctx: JobContext) => Promise<TData>;
	staleFn: StaleFn;
	/** Есть ли рабочее описание джобы (registerJob / runJob / setJobData); иначе tickJob не трогает. */
	registered: boolean;
	invalidated: boolean;
	ctx: JobContext;
	state: JobStatePlain<TData>;
	subscribers: Set<JobListener>;
	gcTimeout: ReturnType<typeof setTimeout> | undefined;
	promise: Promise<TData> | undefined;
};

/** Внутреннее плоское состояние (для patch); наружу отдаётся как JobView. */
type JobStatePlain<TData = unknown> = {
	status: JobStatus;
	data: TData | undefined;
	error: Error | undefined;
	dataUpdatedAt: number | undefined;
	isStale: boolean;
};

function emptyMeta(): JobMeta {
	return {
		startedAt: undefined,
		endedAt: undefined,
		error: undefined,
		status: "idle",
		dataUpdatedAt: undefined,
	};
}

function createContext(): JobContext {
	return { meta: emptyMeta() } as JobContext;
}

function defaultStaleFn(): StaleFn {
	return () => false;
}

function keysEqual(a: JobKey, b: JobKey): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (!Object.is(a[i], b[i])) return false;
	}
	return true;
}

function findEntry<TData>(
	map: Map<string, CacheEntry>,
	jobKey: JobKey,
): CacheEntry<TData> | undefined {
	for (const entry of map.values()) {
		if (keysEqual(entry.jobKey, jobKey)) {
			return entry as CacheEntry<TData>;
		}
	}
	return undefined;
}

function hashKey(key: JobKey): string {
	try {
		return JSON.stringify(key);
	} catch {
		return String(key);
	}
}

function now(): number {
	return Date.now();
}

function syncMetaFromState<TData>(entry: CacheEntry<TData>) {
	const s = entry.state;
	entry.ctx.meta.status = s.status;
	entry.ctx.meta.error = s.error;
	entry.ctx.meta.dataUpdatedAt = s.dataUpdatedAt;
}

function computeIsStale<TData>(entry: CacheEntry<TData>): boolean {
	if (entry.invalidated) return true;
	if (entry.state.status !== "success") return true;
	return entry.staleFn(entry.ctx);
}

function toJobView<TData>(entry: CacheEntry<TData>): JobView<TData> {
	const isStale = computeIsStale(entry);
	const context = entry.ctx;
	const s = entry.state;
	switch (s.status) {
		case "idle":
			return { status: "idle", isStale, context };
		case "pending":
			return {
				status: "pending",
				isStale,
				context,
				data: s.data,
				dataUpdatedAt: s.dataUpdatedAt,
			};
		case "success":
			return {
				status: "success",
				isStale,
				context,
				data: s.data as TData,
				dataUpdatedAt: s.dataUpdatedAt as number,
			};
		case "error": {
			const err = s.error;
			return {
				status: "error",
				isStale,
				context,
				error: err ?? new Error("unknown job error"),
				data: s.data,
				dataUpdatedAt: s.dataUpdatedAt,
			};
		}
	}
}

export class JobController {
	private readonly cache = new Map<string, CacheEntry>();
	private readonly defaultGcTime: number;

	constructor(options: JobControllerOptions = {}) {
		this.defaultGcTime = options.defaultGcTime ?? 5 * 60 * 1000;
	}

	getJobState<TData>(jobKey: JobKey): JobView<TData> {
		const entry = findEntry<TData>(this.cache, jobKey);
		if (!entry) {
			return {
				status: "idle",
				isStale: true,
				context: createContext(),
			};
		}
		return toJobView(entry);
	}

	/**
	 * Регистрирует джобу по ключу без немедленного запуска. Для фонового цикла: список ключей + `tickJob` по каждому.
	 */
	registerJob<TData>(options: JobRunOptions<TData>): void {
		const staleFn = options.staleFn ?? defaultStaleFn();
		const entry = this.ensureEntry(options.jobKey, {
			jobKey: options.jobKey,
			jobFn: options.jobFn,
			staleFn,
			registered: true,
		});
		entry.state = {
			...entry.state,
			isStale: computeIsStale(entry),
		};
		syncMetaFromState(entry);
		this.notify(entry);
	}

	/**
	 * Если джоба зарегистрирована — то же, что `runJob` с сохранёнными `jobFn` / `staleFn`. Иначе `not_registered`.
	 */
	async tickJob<TData>(jobKey: JobKey): Promise<TickJobResult<TData>> {
		const entry = findEntry<TData>(this.cache, jobKey);
		if (!entry?.registered) {
			return { kind: "not_registered" };
		}
		const hadSuccess = entry.state.status === "success" && entry.state.data !== undefined;
		const wasStale = computeIsStale(entry);
		try {
			const data = await this.runJob({
				jobKey: entry.jobKey,
				jobFn: entry.jobFn,
				staleFn: entry.staleFn,
			});
			if (hadSuccess && !wasStale) {
				return { kind: "cached", data };
			}
			return { kind: "completed", data };
		} catch (e) {
			const error = e instanceof Error ? e : new Error(String(e));
			return { kind: "failed", error };
		}
	}

	/** Последовательный tick по списку ключей. */
	async tickJobs(jobKeys: readonly JobKey[]): Promise<void> {
		for (const key of jobKeys) {
			await this.tickJob(key);
		}
	}

	/** Ключи джоб, для которых вызывали `registerJob`, `runJob` или `setJobData`. */
	getRegisteredJobKeys(): JobKey[] {
		const out: JobKey[] = [];
		for (const entry of this.cache.values()) {
			if (entry.registered) {
				out.push(entry.jobKey);
			}
		}
		return out;
	}

	/**
	 * Подписка: `listener` получает **JobView** (дискриминированный union по `status`).
	 */
	subscribe<TData = unknown>(
		jobKey: JobKey,
		listener: (snapshot: JobView<TData>) => void,
	): () => void {
		const entry = this.ensureEntry(jobKey, {
			jobKey,
			jobFn: async () => {
				throw new Error(
					"JobController: нет jobFn — вызовите registerJob, runJob или setJobData",
				);
			},
			staleFn: defaultStaleFn(),
			registered: false,
		});
		const wrapped: JobListener = (snap) => listener(snap as JobView<TData>);
		entry.subscribers.add(wrapped);
		this.cancelGc(entry);
		return () => {
			entry.subscribers.delete(wrapped);
			this.scheduleGc(entry);
		};
	}

	private notify(entry: CacheEntry) {
		const snapshot = toJobView(entry);
		for (const fn of entry.subscribers) {
			try {
				fn(snapshot);
			} catch (e) {
				console.error("JobController subscriber error:", e);
			}
		}
	}

	private cancelGc(entry: CacheEntry) {
		if (entry.gcTimeout !== undefined) {
			clearTimeout(entry.gcTimeout);
			entry.gcTimeout = undefined;
		}
	}

	private scheduleGc(entry: CacheEntry) {
		if (entry.subscribers.size > 0) return;
		if (this.defaultGcTime === Number.POSITIVE_INFINITY) return;
		this.cancelGc(entry);
		entry.gcTimeout = setTimeout(() => {
			entry.gcTimeout = undefined;
			if (entry.subscribers.size === 0) {
				const id = hashKey(entry.jobKey);
				this.cache.delete(id);
			}
		}, this.defaultGcTime);
	}

	private ensureEntry<TData>(
		jobKey: JobKey,
		initial: Pick<CacheEntry<TData>, "jobKey" | "jobFn" | "staleFn" | "registered">,
	): CacheEntry<TData> {
		const id = hashKey(jobKey);
		let entry = this.cache.get(id) as CacheEntry<TData> | undefined;
		if (entry && keysEqual(entry.jobKey, jobKey)) {
			entry.jobFn = initial.jobFn;
			entry.staleFn = initial.staleFn;
			if (initial.registered) {
				entry.registered = true;
			}
			return entry;
		}
		if (entry) {
			this.cache.delete(id);
		}
		const existing = findEntry<TData>(this.cache, jobKey);
		if (existing) {
			existing.jobFn = initial.jobFn;
			existing.staleFn = initial.staleFn;
			if (initial.registered) {
				existing.registered = true;
			}
			return existing;
		}
		entry = {
			jobKey,
			jobFn: initial.jobFn,
			staleFn: initial.staleFn,
			registered: initial.registered,
			invalidated: false,
			ctx: createContext(),
			state: {
				status: "idle",
				data: undefined,
				error: undefined,
				dataUpdatedAt: undefined,
				isStale: true,
			},
			subscribers: new Set(),
			gcTimeout: undefined,
			promise: undefined,
		};
		this.cache.set(id, entry);
		return entry;
	}

	private patchState<TData>(entry: CacheEntry<TData>, patch: Partial<JobStatePlain<TData>>) {
		const next = { ...entry.state, ...patch };
		entry.state = {
			...next,
			isStale: computeIsStale({ ...entry, state: next }),
		};
		syncMetaFromState(entry);
		this.notify(entry);
	}

	/**
	 * Запускает jobFn, если нет успешных данных или они stale (или `force`).
	 * Параллельные вызовы с тем же ключом получают один и тот же Promise.
	 */
	async runJob<TData>(
		options: JobRunOptions<TData> & { force?: boolean },
	): Promise<TData> {
		const staleFn = options.staleFn ?? defaultStaleFn();
		const entry = this.ensureEntry(options.jobKey, {
			jobKey: options.jobKey,
			jobFn: options.jobFn,
			staleFn,
			registered: true,
		});

		const shouldRun =
			options.force === true ||
			entry.state.status !== "success" ||
			computeIsStale(entry);

		if (!shouldRun && entry.state.data !== undefined) {
			return entry.state.data;
		}

		if (entry.promise !== undefined) {
			return entry.promise;
		}

		entry.promise = (async () => {
			entry.ctx.meta.startedAt = now();
			entry.ctx.meta.endedAt = undefined;
			entry.ctx.meta.error = undefined;
			this.patchState(entry, { status: "pending", error: undefined });
			try {
				const data = await entry.jobFn(entry.ctx);
				entry.invalidated = false;
				entry.ctx.meta.endedAt = now();
				this.patchState(entry, {
					status: "success",
					data,
					error: undefined,
					dataUpdatedAt: now(),
				});
				return data;
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				entry.ctx.meta.endedAt = now();
				entry.ctx.meta.error = error;
				this.patchState(entry, {
					status: "error",
					error,
				});
				throw error;
			} finally {
				entry.promise = undefined;
			}
		})();

		return entry.promise;
	}

	async prefetchJob<TData>(options: JobRunOptions<TData>): Promise<void> {
		try {
			await this.runJob(options);
		} catch {
			// состояние уже в кеше
		}
	}

	setJobData<TData>(jobKey: JobKey, data: TData): void {
		const entry = findEntry<TData>(this.cache, jobKey);
		if (!entry) {
			const id = hashKey(jobKey);
			const ctx = createContext();
			ctx.meta.endedAt = now();
			const newEntry: CacheEntry<TData> = {
				jobKey,
				jobFn: async (_ctx) => data,
				staleFn: defaultStaleFn(),
				registered: true,
				invalidated: false,
				ctx,
				state: {
					status: "success",
					data,
					error: undefined,
					dataUpdatedAt: now(),
					isStale: false,
				},
				subscribers: new Set(),
				gcTimeout: undefined,
				promise: undefined,
			};
			syncMetaFromState(newEntry);
			this.cache.set(id, newEntry);
			this.notify(newEntry);
			return;
		}
		entry.registered = true;
		entry.ctx.meta.endedAt = now();
		entry.invalidated = false;
		this.patchState(entry, {
			status: "success",
			data,
			error: undefined,
			dataUpdatedAt: now(),
		});
	}

	/**
	 * Помечает джобы как устаревшие. При `refetchActive` перезапускает run у джоб с подписчиками.
	 */
	invalidateJobs(
		predicate: (key: JobKey) => boolean,
		options: { refetchActive?: boolean } = {},
	): void {
		const refetchActive = options.refetchActive ?? false;
		for (const entry of this.cache.values()) {
			if (!predicate(entry.jobKey)) continue;
			entry.invalidated = true;
			entry.state = {
				...entry.state,
				isStale: computeIsStale(entry),
			};
			syncMetaFromState(entry);
			this.notify(entry);
			if (refetchActive && entry.registered && entry.subscribers.size > 0) {
				void this.runJob({
					jobKey: entry.jobKey,
					jobFn: entry.jobFn,
					staleFn: entry.staleFn,
					force: true,
				});
			}
		}
	}

	removeJobs(predicate: (key: JobKey) => boolean): void {
		for (const [id, entry] of [...this.cache.entries()]) {
			if (predicate(entry.jobKey)) {
				this.cancelGc(entry);
				this.cache.delete(id);
			}
		}
	}
}

export function createJobController(options?: JobControllerOptions): JobController {
	return new JobController(options);
}
