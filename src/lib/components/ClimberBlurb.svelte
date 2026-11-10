<script lang="ts">
	import type { StoryRouteLink } from '#lib/types/climbingStory';
	type Props = { paragraphs: string[]; routeLink?: StoryRouteLink | null; title?: string };
	let { paragraphs, routeLink = null, title = 'Climbing story' }: Props = $props();
</script>

<article class="panel">
	<h2>{title}</h2>
	{#each paragraphs as p, i (i)}
		<p class="blurb">
			{#if routeLink && routeLink.paragraph === i}{p.slice(0, routeLink.start)}<a
					href={routeLink.href}
					target="_blank"
					rel="noreferrer">{p.slice(routeLink.start, routeLink.end)}</a
				>{p.slice(routeLink.end)}{:else}{p}{/if}
		</p>
	{/each}
	<p class="foot"><a class="how" href="/docs/climbing-story">How it works</a></p>
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
		margin-bottom: 0.65rem;
	}
	.blurb a {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 0.15em;
		overflow-wrap: anywhere;
	}
	.foot {
		margin: 0.35rem 0 0;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
</style>
