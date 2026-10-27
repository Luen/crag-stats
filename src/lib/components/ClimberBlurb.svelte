<script lang="ts">
	type Props = { paragraphs: string[]; title?: string };
	let { paragraphs, title = 'Climbing story' }: Props = $props();
</script>

<article class="panel">
	<h2>{title}</h2>
	{#each paragraphs as p, i (i)}
		<p class="blurb">{p}</p>
	{/each}
</article>

<style>
	.panel {
		padding: 1.1rem 1.25rem;
		border-radius: 1rem;
	}
	h2 {
		margin: 0 0 0.65rem;
		font-size: 1.05rem;
	}
	.blurb {
		margin: 0 0 0.65rem;
		line-height: 1.55;
		color: var(--ink);
		font-size: 0.98rem;
	}
	.blurb:last-child {
		margin-bottom: 0;
	}
</style>
