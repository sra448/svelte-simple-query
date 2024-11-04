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

function generateCacheFragment(param: Record<string, unknown>) {
	return Object.entries(param)
		.map(([key, value]) => `${key}:${String(value)}`)
		.sort()
		.join('|');
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
	// const randomKey = Math.random().toString(36).substring(2, 4);
	const getKey = (queryParam: P) =>
		typeof key === 'function'
			? key(queryParam)
			: queryParam
				? [...key, generateCacheFragment(queryParam)]
				: key;

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
			// console.log(
			// 	randomKey,
			// 	$state.snapshot(internal.currentKey),
			// 	'dataCache or currentKey updated'
			// );

			if (internal.currentKey) {
				query.data = dataCache.getCache(internal.currentKey) as T;
			}
		});

		$effect(() => {
			// console.log(
			// 	randomKey,
			// 	$state.snapshot(internal.currentKey),
			// 	'loadingCache or currentKey updated'
			// );

			if (internal.currentKey) {
				query.loading = !!loadingCache.getCache(internal.currentKey);
			}
		});

		const load = async (queryParam: P) => {
			const cacheKey = getKey(queryParam);
			internal.currentKey = cacheKey;

			const alreadyLoading = untrack(() => loadingCache.getCache(cacheKey));
			if (alreadyLoading) {
				// console.log(randomKey, cacheKey, 'already loading, skipping');
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
			const currentKey = getKey(queryParam);
			untrack(() => {
				// console.log(randomKey, currentKey, 'add load to queriesCache');
				queriesCache.setCache(currentKey, () => {
					// console.log(randomKey, currentKey, 'load from cache-invalidation');
					load(queryParam);
				});
			});

			// console.log(randomKey, currentKey, 'effect (calling load)');
			load(queryParam);

			return () => {
				// console.log(randomKey, currentKey, 'cleanup');
				// TOOD: only remove if no other queries are using this key
				queriesCache.removeCache(currentKey);
			};
		});

		return {
			query,
			refetch: () => {
				load(queryParam);
			}
		};
	};
}
