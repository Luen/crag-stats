<script lang="ts">
	import EddingtonMilestones from '#lib/components/EddingtonMilestones.svelte';
	import EddingtonTimelineChart from '#lib/components/EddingtonTimelineChart.svelte';
	import { eddingtonTiles } from '#lib/eddingtonDisplay';
	import { formatNumber } from '#lib/dates';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const tiles = $derived(eddingtonTiles(data.stats));
</script>

<svelte:head>
	<title>Eddington numbers · Crag Stats</title>
	<meta
		name="description"
		content="Send-day, vertical, and grade-index Eddington numbers from your climbing logbook."
	/>
</svelte:head>

<section class="panel head">
	<h1>Eddington numbers</h1>
	<p>
		Consistency metrics inspired by cycling's Eddington number — how your send days, vertical, and
		grade indexes grew over time.
		<a href="/docs/eddington">How it works</a>
	</p>
	<p class="meta">
		{formatNumber(data.stats.activeDays, data.dateDisplay)} active logbook days in total.
	</p>
</section>

<section class="tiles">
	{#each tiles as t (t.key)}
		<article class="panel tile">
			<span class="label">{t.label}</span>
			<strong>{t.value}</strong>
			<span class="means">{t.means}</span>
			<span class="next">{t.next}</span>
		</article>
	{/each}
</section>

<EddingtonTimelineChart timeline={data.timeline} />

<EddingtonMilestones tables={data.milestones} />

<style>
	.head {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h1 {
		margin: 0 0 0.35rem;
		font-size: 1.45rem;
	}
	.head p {
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.92rem;
		max-width: 42rem;
	}
	.head a {
		color: var(--accent);
	}
	.meta {
		margin-top: 0.5rem !important;
		font-size: 0.82rem !important;
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
		gap: 0.55rem;
		margin: 0.85rem 0;
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.75rem 0.7rem 0.65rem;
		border-radius: 1rem;
		border-top: 3px solid var(--accent-2);
	}
	.tile strong {
		font-size: 1.9rem;
		line-height: 1.1;
		font-family: var(--font-display);
	}
	.label {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--ink-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.means {
		font-size: 0.82rem;
	}
	.next {
		color: var(--ink-muted);
		font-size: 0.76rem;
	}
</style>
