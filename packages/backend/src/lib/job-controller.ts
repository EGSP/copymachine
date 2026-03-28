/**
 * Примитивный job/query-контроллер в духе TanStack Query для фоновых задач на бэкенде:
 * ключи, кеш, staleTime, дедупликация параллельных запусков, подписки, invalidate.
 */

export type JobKey = readonly unknown[];

export type JobStatus = "idle" | "pending" | "success" | "error";

export type JobState<TData = unknown> = {
	status: JobStatus;
	data: TData | undefined;
	error: Error | undefined;
	dataUpdatedAt: number | undefined;
	isStale: boolean;
};

export type JobFetchOptions<TData> = {
	queryKey: JobKey;
	queryFn: () => Promise<TData>;
	/** Время «свежести» в мс. По умолчанию 0 — сразу считается устаревшим. */
	staleTime?: number;
};

export type JobControllerOptions = {
	/**
	 * Время жизни записи в кеше после того, как на неё никто не подписан (мс).
	 * По умолчанию 5 минут; `Infinity` — не удалять по GC.
	 */
	defaultGcTime?: number;
};

type CacheEntry<TData = unknown> = {
	queryKey: JobKey;
	queryFn: () => Promise<TData>;
	staleTime: number;
	/** После invalidateQueries — считается stale, пока не придёт успешный fetch. */
	invalidated: boolean;
	state: JobState<TData>;
	subscribers: Set<() => void>;
	gcTimeout: ReturnType<typeof setTimeout> | undefined;
	promise: Promise<TData> | undefined;
};

function keysEqual(a: JobKey, b: JobKey): boolean {
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) {
		if (!Object.is(a[i], b[i])) return false;
	}
	return true;
}

function findEntry<TData>(
	map: Map<string, CacheEntry>,
	queryKey: JobKey,
): CacheEntry<TData> | undefined {
	for (const entry of map.values()) {
		if (keysEqual(entry.queryKey, queryKey)) {
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

function computeIsStale<TData>(
	entry: Pick<CacheEntry<TData>, "staleTime" | "invalidated" | "state">,
): boolean {
	if (entry.invalidated) return true;
	const { status, dataUpdatedAt: updated } = entry.state;
	if (status !== "success") return true;
	if (updated === undefined) return true;
	if (entry.staleTime === Number.POSITIVE_INFINITY) return false;
	return now() - updated > entry.staleTime;
}

export class JobController {
	private readonly cache = new Map<string, CacheEntry>();
	private readonly defaultGcTime: number;

	constructor(options: JobControllerOptions = {}) {
		this.defaultGcTime = options.defaultGcTime ?? 5 * 60 * 1000;
	}

	getQueryState<TData>(queryKey: JobKey): JobState<TData> {
		const entry = findEntry<TData>(this.cache, queryKey);
		if (!entry) {
			return {
				status: "idle",
				data: undefined,
				error: undefined,
				dataUpdatedAt: undefined,
				isStale: true,
			};
		}
		const isStale = computeIsStale(entry);
		return { ...entry.state, isStale };
	}

	subscribe(queryKey: JobKey, listener: () => void): () => void {
		const entry = this.ensureEntry(queryKey, {
			queryKey,
			queryFn: async () => {
				throw new Error(
					"JobController: для этой подписки не задан queryFn — вызовите setQueryData или fetchQuery с queryFn",
				);
			},
			staleTime: 0,
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
				const id = hashKey(entry.queryKey);
				this.cache.delete(id);
			}
		}, this.defaultGcTime);
	}

	private ensureEntry<TData>(
		queryKey: JobKey,
		initial: Pick<CacheEntry<TData>, "queryKey" | "queryFn" | "staleTime">,
	): CacheEntry<TData> {
		const id = hashKey(queryKey);
		let entry = this.cache.get(id) as CacheEntry<TData> | undefined;
		if (entry && keysEqual(entry.queryKey, queryKey)) {
			entry.queryFn = initial.queryFn;
			entry.staleTime = initial.staleTime;
			return entry;
		}
		if (entry) {
			this.cache.delete(id);
		}
		const existing = findEntry<TData>(this.cache, queryKey);
		if (existing) {
			existing.queryFn = initial.queryFn;
			existing.staleTime = initial.staleTime;
			return existing;
		}
		entry = {
			queryKey,
			queryFn: initial.queryFn,
			staleTime: initial.staleTime,
			invalidated: false,
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
		this.notify(entry);
	}

	/**
	 * Запускает queryFn, если данных нет или они stale (или force).
	 * Параллельные вызовы с тем же ключом получают один и тот же Promise.
	 */
	async fetchQuery<TData>(
		options: JobFetchOptions<TData> & { force?: boolean },
	): Promise<TData> {
		const staleTime = options.staleTime ?? 0;
		const entry = this.ensureEntry(options.queryKey, {
			queryKey: options.queryKey,
			queryFn: options.queryFn,
			staleTime,
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
			this.patchState(entry, { status: "pending", error: undefined });
			try {
				const data = await entry.queryFn();
				entry.invalidated = false;
				this.patchState(entry, {
					status: "success",
					data,
					error: undefined,
					dataUpdatedAt: now(),
				});
				return data;
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
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

	async prefetchQuery<TData>(options: JobFetchOptions<TData>): Promise<void> {
		try {
			await this.fetchQuery(options);
		} catch {
			// prefetch не пробрасывает — состояние уже в cache
		}
	}

	setQueryData<TData>(queryKey: JobKey, data: TData): void {
		const entry = findEntry<TData>(this.cache, queryKey);
		if (!entry) {
			const id = hashKey(queryKey);
			const newEntry: CacheEntry<TData> = {
				queryKey,
				queryFn: async () => data,
				staleTime: 0,
				invalidated: false,
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
			this.cache.set(id, newEntry);
			return;
		}
		this.patchState(entry, {
			status: "success",
			data,
			error: undefined,
			dataUpdatedAt: now(),
		});
	}

	/**
	 * Помечает совпадающие ключи как устаревшие. Если refetchActive — перезапускает fetch у записей с подписчиками.
	 */
	invalidateQueries(
		predicate: (key: JobKey) => boolean,
		options: { refetchActive?: boolean } = {},
	): void {
		const refetchActive = options.refetchActive ?? false;
		for (const entry of this.cache.values()) {
			if (!predicate(entry.queryKey)) continue;
			entry.invalidated = true;
			entry.state = {
				...entry.state,
				isStale: computeIsStale(entry),
			};
			this.notify(entry);
			if (refetchActive && entry.subscribers.size > 0) {
				void this.fetchQuery({
					queryKey: entry.queryKey,
					queryFn: entry.queryFn,
					staleTime: entry.staleTime,
					force: true,
				});
			}
		}
	}

	removeQueries(predicate: (key: JobKey) => boolean): void {
		for (const [id, entry] of [...this.cache.entries()]) {
			if (predicate(entry.queryKey)) {
				this.cancelGc(entry);
				this.cache.delete(id);
			}
		}
	}
}

export function createJobController(options?: JobControllerOptions): JobController {
	return new JobController(options);
}
