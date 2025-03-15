import { untrack } from 'svelte';
import createCache from './cache.svelte';

// Types

type LoadSuccess<T> = {
	success: true;
	data: T;
};

type LoadFailure<E> = {
	success: false;
	error: E;
};

type LoadResult<T, E> = LoadSuccess<T> | LoadFailure<E>;

// Helpers

function generateKeyFragment(param: Record<string, unknown>) {
	return Object.entries(param)
		.map(([key, value]) => `${key}:${String(value)}`)
		.sort()
		.join('|');
}

function generateKey<T>(baseKey: string[] | ((params: T) => string[]), queryParam: T) {
	return typeof baseKey === 'function'
		? baseKey(queryParam)
		: queryParam
			? [...baseKey, generateKeyFragment(queryParam)]
			: baseKey;
}

// State

export const globalLoading = $state({ loadingCount: 0 });
export const queriesCache = createCache('querie-caches');
export const loadingCache = createCache('loading-cache');
export const errorCache = createCache('error-cache');
export const dataCache = createCache('data-cache');

// Actions

export function invalidateQuery(key: string[]) {
	const queries = queriesCache.getCaches(key);
	for (const query of queries) {
		if (query && typeof query === 'function') {
			query();
		}
	}
}

export function useQuery<E, P = void, T = unknown>(
	key: string[] | ((queryParam: P) => string[]),
	loadFn: (queryParam: P) => Promise<LoadResult<T, E>>,
	options?: {
		initialData: T;
	}
) {
	const createState = () => {
		const internal = $state({
			currentKey: undefined as string[] | undefined
		});

		const query = $state({
			loading: false,
			error: undefined as E | undefined,
			data: options?.initialData
		});

		$effect(() => {
			if (internal.currentKey) {
				query.data = dataCache.getCache(internal.currentKey) as T;
			}
		});

		$effect(() => {
			if (internal.currentKey) {
				query.loading = !!loadingCache.getCache(internal.currentKey);
			}
		});

		$effect(() => {
			if (internal.currentKey) {
				query.error = errorCache.getCache(internal.currentKey) as E | undefined;
			}
		});

		return {
			internal,
			query
		};
	};

	const load = async (queryParam: P) => {
		const cacheKey = generateKey(key, queryParam);

		const alreadyLoading = untrack(() => loadingCache.getCache(cacheKey));
		if (alreadyLoading) {
			return;
		}

		untrack(() => {
			loadingCache.setCache(cacheKey, true);
			errorCache.removeCache(cacheKey);
			globalLoading.loadingCount++;
		});

		const loadResult = await loadFn(queryParam);
		if (loadResult.success) {
			dataCache.setCache(cacheKey, loadResult.data);
		} else {
			errorCache.setCache(cacheKey, loadResult.error);
		}

		untrack(() => {
			loadingCache.removeCache(cacheKey);
			globalLoading.loadingCount--;
		});
	};

	return (queryParam: P) => {
		const { internal, query } = createState();

		$effect(() => {
			const cacheKey = generateKey(key, queryParam);
			internal.currentKey = cacheKey;

			untrack(() => {
				const frozenQueryParam = $state.snapshot(queryParam) as P;
				queriesCache.setCache(cacheKey, () => {
					load(frozenQueryParam);
				});
			});

			load(queryParam);

			return () => {
				untrack(() => {
					queriesCache.removeCache(cacheKey);
				});
			};
		});

		const refetch = () => {
			const query = queriesCache.getCache(generateKey(key, queryParam));
			if (query && typeof query === 'function') {
				query();
			}
		};

		return {
			query,
			refetch
		};
	};
}
