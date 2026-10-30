<script lang="ts">
	import Badges from '#lib/components/Badges.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Badges · Crag Stats</title>
	<meta name="description" content="Earned and locked climbing badges from your theCrag logbook." />
</svelte:head>

<section class="panel head">
	<h1>Badges</h1>
	<p>
		Logbook milestones that stick — sends, onsights, height, holidays, first ascents and more. The
		dashboard card shows recently earned badges; everything lives here.
	</p>
</section>

<Badges
	earned={data.badges.earned}
	locked={data.badges.locked}
	earnedCount={data.badges.earnedCount}
	totalCount={data.badges.totalCount}
	titleHref={null}
	layout="grid"
/>

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
		line-height: 1.45;
	}
</style>
