<script lang="ts">
	import Code from '$lib/examples/components/Code.svelte';
</script>

<main>
	<h1>Svelte Simple Query</h1>

	<p>
		Svelte Simple Query is a small svelte library that helps simplify caching loaded data by
		allowing you to declaratively define queries and then use them in your components.
	</p>

	<section>
		<div>
			<h2>Queries</h2>

			<p>
				A query is a simple abstraction that represents a piece of data, its loading function and a
				key that identifies the whole unit.
			</p>

			<p>
				The query takes care of loading the data and caching it. It makes available the loading
				state, the data, and any error that occurred during loading and a function to manually
				reload the data.
			</p>

			<p>
				Queries are created using the <code>useQuery</code> function. This function takes a key and a
				function that loads the data. The key is used to identify the query and the data it loads. The
				loading function is called whenever the query is invalidated.
			</p>
		</div>
		<div>
			<Code
				content={`
import { useQuery, succeed, fail } from 'svelte-simple-query';

const useFriends = useQuery(
  ['friends'],
  async () => {
	  try {
			const data = await fetchFriends();
			return succeed(data);
		} catch (error) {
			return fail(error);
		}
  }
);

const { query } = useFriends();`}
			/>
		</div>
	</section>

	<section>
		<div>
			<h2>Invalidating</h2>
		</div>
	</section>
</main>

<!-- <QueryExample /> -->

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 1000px;
		margin: 0 auto;
		font-size: 1.25rem;
	}

	section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	section > div {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 1rem;
		overflow-x: auto;
	}
</style>
