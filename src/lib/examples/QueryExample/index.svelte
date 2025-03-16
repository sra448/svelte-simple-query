<script lang="ts">
	import { succeed, fail } from '$lib/loadResult';
	import { useQuery } from '$lib/query.svelte';
	import { requestFriend, requestFriends } from './fakeServer';

	// Queries (you might have these in a separate file)

	const useFriends = useQuery(['friends'], async () => {
		try {
			const data = await requestFriends();
			return succeed(data);
		} catch (error) {
			return fail(error);
		}
	});

	// const useFriend = useQuery(
	// 	({ id }) => ['friends', `${id}`],
	// 	async ({ id }: { id: number }) => {
	// 		try {
	// 			const data = await requestFriend(id);
	// 			return succeed(data);
	// 		} catch (error) {
	// 			return fail(error);
	// 		}
	// 	}
	// );

	// State

	let friendParam = $state({
		id: undefined as number | undefined
	});

	const { query: friendsQuery } = useFriends();
	// const { query: friendQuery } = useFriend(friendParam);
</script>

<div class="container">
	<div class="friends">
		<h2>Friends</h2>

		{#if friendsQuery.error}
			<p>Error: {friendsQuery.error}</p>
		{/if}

		{#if friendsQuery.loading}
			<p>Loading...</p>
		{:else}
			{#each friendsQuery.data ?? [] as friend}
				<button
					class="friend"
					onclick={() => {
						// onFriendSelected(friend.id);
					}}
				>
					<div>{friend.name}</div>
					<div>Age: {friend.age} seconds</div>
				</button>
			{/each}
		{/if}
	</div>

	<!-- <Friend id={currentFriendId} /> -->
</div>

<style>
	.container {
		display: flex;
		align-items: center;
	}
</style>
