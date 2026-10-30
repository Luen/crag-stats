<script lang="ts">
	import TrainingLoad from '#lib/components/TrainingLoad.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Training load · Crag Stats</title>
	<meta
		name="description"
		content="Acute:chronic training load, weekly and daily intensity from your climbing logbook."
	/>
</svelte:head>

<section class="panel head">
	<h1>Training load</h1>
	<p>
		How hard you've been climbing lately versus what you're used to — the acute:chronic workload
		ratio used in sports science and climbing coaching. Treat the bands as a nudge, not a diagnosis.
		<a href="/docs/training-load">How it works</a>
	</p>
</section>

<TrainingLoad load={data.trainingLoad} weeksShown={26} titleHref={null} showDaily />

<style>
	.head {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
		margin-bottom: 0.85rem;
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
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
