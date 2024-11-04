<script lang="ts">
	import {
		useQuery,
		globalLoading,
		dataCache,
		queriesCache,
		invalidateQuery
	} from '$lib/simple-query.svelte';

	function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function formatTime(time: Date) {
		const timeFormat = new Intl.DateTimeFormat('en', {
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric',
			hour12: false
		});
		return timeFormat.format(time);
	}

	let count1 = $state({ num: 11 });
	let count2 = $state({ num: 11 });
	let count3 = $state({ num: 21 });

	const useFoo = useQuery(['foo'], async ({ num }: { num: number }) => {
		console.log('actual load fn foo:', num);
		await sleep(Math.random() * 2000);
		console.log('actual load fn foo done:', num);
		return {
			success: true,
			data: [num, num + 1, num + 2, formatTime(new Date())]
		};
	});

	const useFooKeyed = useQuery(
		(p: { num: number }) => ['bar', `${p.num}`, 'num'],
		async ({ num }) => {
			console.log('actual load fn bar:', num);
			await sleep(1000);
			console.log('actual load fn bar done:', num);
			return {
				success: true,
				data: [num, num + 1, num + 2, formatTime(new Date())]
			};
		}
	);

	const { query: query1 } = useFoo(count1);
	const { query: query2 } = useFoo(count2);
	const { query: query3 } = useFooKeyed(count3);

	let invalidateStr = $state('["bar", "21", "num"]');

	$inspect('dataCache', dataCache.cache);
	// $inspect('queriesCache', queriesCache.cache);
</script>

<div>
	<div>{globalLoading.loading > 0 ? '🐲' : '🦄'}</div>
</div>

<div>
	<div>{count1.num}</div>
	<button onclick={() => count1.num--}>-</button>
	<button onclick={() => count1.num++}>+</button>
	<div>{query1.loading ? '🐲' : '🦄'}</div>
	{#each query1.data ?? [] as item}
		<div>{item}</div>
	{/each}
</div>

<div>
	<div>{count2.num}</div>
	<button onclick={() => count2.num--}>-</button>
	<button onclick={() => count2.num++}>+</button>
	<div>{query2.loading ? '🐲' : '🦄'}</div>
	{#each query2.data ?? [] as item}
		<div>{item}</div>
	{/each}
</div>

<div>
	<div>{count3.num}</div>
	<button onclick={() => count3.num--}>-</button>
	<button onclick={() => count3.num++}>+</button>
	<div>{query3.loading ? '🐲' : '🦄'}</div>
	{#each query3.data ?? [] as item}
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
