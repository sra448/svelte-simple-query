<script lang="ts">
	import { codeToHtml } from 'shiki';

	type Props = {
		content: string;
	};

	const { content }: Props = $props();

	const html = codeToHtml(content.trim().replace(/\t/g, '  '), {
		lang: 'javascript',
		themes: {
			light: 'plastic',
			dark: 'nord'
		}
	});
</script>

<div class="code">
	{#await html}
		parsing
	{:then value}
		{@html value}
	{/await}
</div>

<style>
	.code {
		font-size: 1rem;
		line-height: 1.5;
		border-radius: 1rem;
		overflow-x: auto;

		:global(> .shiki) {
			padding: 2rem 1.5rem;
			border-radius: 1rem;
			overflow-x: auto;
		}
	}
</style>
