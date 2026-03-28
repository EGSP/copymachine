/**
 * Примитивный job-контроллер (кеш, дедупликация in-flight, подписки, invalidate) для фона на бэкенде.
 *
 * ## Что можно читать у джобы (`getJobState` / в колбэке подписки)
 *
 * - **status** — `"idle"` | `"pending"` | `"success"` | `"error"`
 * - **data** — результат последнего успешного выполнения (`undefined`, пока не было успеха)
 * - **error** — ошибка последнего неуспешного завершения
 * - **dataUpdatedAt** — время успешного обновления данных (мс, `Date.now()`)
 * - **isStale** — пересчитывается через **staleFn(ctx)** и флаг invalidate
 * - **context** — тот же объект **ctx**, что и у `jobFn`: `context.meta` + ваши поля
 *
 * ## Поля **context.meta** (заполняет контроллер)
 *
 * - **startedAt** — начало текущего/последнего запуска
 * - **endedAt** — конец последнего запуска (после success или error)
 * - **error** — дублирует `state.error` после ошибки; сбрасывается при новом старте
 * - **status** — копия `status` для удобства внутри `staleFn`
 * - **dataUpdatedAt** — копия `dataUpdatedAt`
 *
 * На **ctx** (кроме замены объекта `meta`) можно вешать свои поля; они живут на экземпляре джобы в кеше.
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

export type JobState<TData = unknown> = {
	status: JobStatus;
	data: TData | undefined;
	error: Error | undefined;
	dataUpdatedAt: number | undefined;
	isStale: boolean;
};

/** Снимок джобы для чтения: состояние + тот же `context`, что получает `jobFn`. */
export type JobView<TData = unknown> = JobState<TData> & {
	context: JobContext;
};

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

type CacheEntry<TData = unknown> = {
	jobKey: JobKey;
	jobFn: (ctx: JobContext) => Promise<TData>;
	staleFn: StaleFn;
	invalidated: boolean;
	ctx: JobContext;
	state: JobState<TData>;
	subscribers: Set<() => void>;
	gcTimeout: ReturnType<typeof setTimeout> | undefined;
	promise: Promise<TData> | undefined;
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

export class JobController {
	private readonly cache = new Map<string, CacheEntry>();
	private readonly defaultGcTime: number;

	constructor(options: JobControllerOptions = {}) {
		this.defaultGcTime = options.defaultGcTime ?? 5 * 60 * 1000;
	}

	getJobState<TData>(jobKey: JobKey): JobView<TData> {
		const entry = findEntry<TData>(this.cache, jobKey);
		if (!entry) {
			const ctx = createContext();
			return {
				status: "idle",
				data: undefined,
				error: undefined,
				dataUpdatedAt: undefined,
				isStale: true,
				context: ctx,
			};
		}
		const isStale = computeIsStale(entry);
		return { ...entry.state, isStale, context: entry.ctx };
	}

	/**
	 * Подписка на изменения джобы по ключу. При каждом обновлении состояния вызывается `listener`.
	 * Пока есть подписчики, запись не удаляется GC. Возвращает функцию отписки.
	 *
	 * @example
	 * const stop = jobs.subscribe(["sync"], () => {
	 *   const v = jobs.getJobState(["sync"]);
	 *   console.log(v.status, v.data, v.context.cursor);
	 * });
	 * // stop();
	 */
	subscribe(jobKey: JobKey, listener: () => void): () => void {
		const entry = this.ensureEntry(jobKey, {
			jobKey,
			jobFn: async () => {
				throw new Error(
					"JobController: нет jobFn для этой джобы — сначала runJob или setJobData",
				);
			},
			staleFn: defaultStaleFn(),
		});
		entry.subscribers.add(listener);
		this.cancelGc(entry);
		return () => {
			entry.subscribers.delete(listener);
			this.scheduleGc(entry);
		};
	}

	private notify(entry: CacheEntry) {
		for (const fn of entry.subscribers) {
			try {
				fn();
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
		initial: Pick<CacheEntry<TData>, "jobKey" | "jobFn" | "staleFn">,
	): CacheEntry<TData> {
		const id = hashKey(jobKey);
		let entry = this.cache.get(id) as CacheEntry<TData> | undefined;
		if (entry && keysEqual(entry.jobKey, jobKey)) {
			entry.jobFn = initial.jobFn;
			entry.staleFn = initial.staleFn;
			return entry;
		}
		if (entry) {
			this.cache.delete(id);
		}
		const existing = findEntry<TData>(this.cache, jobKey);
		if (existing) {
			existing.jobFn = initial.jobFn;
			existing.staleFn = initial.staleFn;
			return existing;
		}
		entry = {
			jobKey,
			jobFn: initial.jobFn,
			staleFn: initial.staleFn,
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

	private patchState<TData>(entry: CacheEntry<TData>, patch: Partial<JobState<TData>>) {
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
			return;
		}
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
			if (refetchActive && entry.subscribers.size > 0) {
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
