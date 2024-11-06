<script lang="ts">
	import {
		useQuery,
		globalLoading,
		dataCache,
		errorCache,
		invalidateQuery
	} from '$lib/simple-query.svelte';

	function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function formatTime(time: Date) {
		const timeFormat = new Intl.DateTimeFormat('en', {
			minute: 'numeric',
			second: 'numeric',
			hour12: false
		});
		return timeFormat.format(time);
	}

	let interrupted = $state(false);
	let count1 = $state({ num: 11 });
	let count2 = $state({ num: 11 });

	const useFoo = useQuery(['foo'], async ({ num }: { num: number }) => {
		console.log('loading query', num);
		await sleep(500 + Math.random() * 1000);
		console.log('loading query done', num);
		if (interrupted) {
			return { success: false, error: 'interrupted' };
		}

		return {
			success: true,
			data: [num, num + 1, num + 2, formatTime(new Date())]
		};
	});

	const { query: query1, refetch: refetch1 } = useFoo(count1);
	const { query: query2, refetch: refetch2 } = useFoo(count2);

	let invalidateStr = $state('["bar", "21", "num"]');

	$inspect('errorCache', errorCache.cache);
	$inspect('dataCache', dataCache.cache);
</script>

<div>
	<div>
		{globalLoading.loadingCount > 0 ? `🐲 Loading (${globalLoading.loadingCount})` : '🦄 Idle'}
	</div>

	<label>
		<input type="checkbox" bind:checked={interrupted} /> sabotage 🤡
	</label>
</div>

<div>
	<div>{count1.num}</div>
	<button onclick={() => count1.num--}>-</button>
	<button onclick={() => count1.num++}>+</button>
	<div><button onclick={refetch1}>♻️</button></div>
	<div>{query1.loading ? '🐲' : '🦄'}</div>
	{#if query1.error}
		<div title={query1.error}>💥</div>
	{/if}
	{#each query1.data ?? [] as item}
		<div>{item}</div>
	{/each}
</div>

<div>
	<div>{count2.num}</div>
	<button onclick={() => count2.num--}>-</button>
	<button onclick={() => count2.num++}>+</button>
	<div><button onclick={refetch2}>♻️</button></div>
	<div>{query2.loading ? '🐲' : '🦄'}</div>
	{#if query1.error}
		<div title={query1.error}>💥</div>
	{/if}
	{#each query2.data ?? [] as item}
		<div>{item}</div>
	{/each}
</div>

<div>
	<input type="text" bind:value={invalidateStr} />
	<button
		type="button"
		onclick={() => {
			invalidateQuery(JSON.parse(invalidateStr));
		}}
	>
		invalidate
	</button>
</div>

<style>
	div {
		font-family: monospace;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	button {
		border: none;
		background-color: none;
		border-radius: 0.25rem;
	}
</style>
