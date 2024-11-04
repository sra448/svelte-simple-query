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

export const globalLoading = $state({
	loading: 0
});

export const dataCache = createCache();

const queriesCache = createCache();

export function invalidateQuery(key: string[]) {
	const queries = queriesCache.getCaches(key);
	for (const query of queries) {
		if (query && typeof query === 'function') {
			query();
		}
	}
}

// Actions

export function useQuery<E, P = void, T = unknown>(
	key: string[] | ((queryParam: P) => string[]),
	loadFn: (queryParam: P) => Promise<LoadResult<T, E>>,
	options?: {
		initialData: T;
	}
) {
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
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			dataCache.cache;

			if (internal.currentKey) {
				// we set the actual data only when currentKey or data change
				query.data = dataCache.getCache(internal.currentKey) as T;
			}
		});

		const load = async (queryParam: P) => {
			const cacheKey = getKey(queryParam);
			internal.currentKey = cacheKey;

			query.loading = true;
			untrack(() => globalLoading.loading++);

			query.error = undefined;
			const loadResult = await loadFn(queryParam);

			if (loadResult.success) {
				dataCache.setCache(cacheKey, loadResult.data);
			} else {
				query.error = loadResult.error;
			}

			query.loading = false;
			untrack(() => globalLoading.loading--);
		};

		return {
			query,
			load
		};
	};

	return (queryParam: P) => {
		const { query, load } = withContext();

		$effect.root(() => {
			$effect(() => {
				const currentKey = getKey(queryParam);
				queriesCache.setCache(currentKey, () => load(queryParam));

				load(queryParam);

				return () => {
					queriesCache.removeCache(currentKey);
				};
			});
		});

		return {
			query,
			load
		};
	};
}
