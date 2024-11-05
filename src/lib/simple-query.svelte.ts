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

export const globalLoading = $state({ loading: 0 });
export const queriesCache = createCache();
export const loadingCache = createCache();
export const dataCache = createCache();

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
	const withContext = () => {
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

		const load = async (queryParam: P) => {
			const cacheKey = generateKey(key, queryParam);
			internal.currentKey = cacheKey;

			const alreadyLoading = untrack(() => loadingCache.getCache(cacheKey));
			if (alreadyLoading) {
				return;
			}

			untrack(() => loadingCache.setCache(cacheKey, true));
			untrack(() => globalLoading.loading++);

			query.error = undefined;
			const loadResult = await loadFn(queryParam);

			if (loadResult.success) {
				dataCache.setCache(cacheKey, loadResult.data);
			} else {
				query.error = loadResult.error;
			}

			untrack(() => loadingCache.removeCache(cacheKey));
			untrack(() => globalLoading.loading--);
		};

		return {
			query,
			load
		};
	};

	return (queryParam: P) => {
		const { query, load } = withContext();

		$effect(() => {
			const currentKey = generateKey(key, queryParam);
			untrack(() => {
				queriesCache.setCache(currentKey, () => {
					load(queryParam);
				});
			});

			load(queryParam);

			return () => {
				queriesCache.removeCache(currentKey);
			};
		});

		return {
			query,
			refetch: () => {
				const query = queriesCache.getCache(generateKey(key, queryParam));
				if (query && typeof query === 'function') {
					query();
				}
			}
		};
	};
}
