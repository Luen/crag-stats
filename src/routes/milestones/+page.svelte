<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import Milestones from '#lib/components/Milestones.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<svelte:head>
	<title>Milestones · Crag Stats</title>
	<meta
		name="description"
		content="Grade, count, height and first-ascent milestones from your logbook."
	/>
</svelte:head>

<section class="panel head">
	<h1>{i18n.t('pages.milestones.titleMilestones')}</h1>
	<p>
		Personal breakthroughs from your logbook — first grades, ascent counts, height landmarks and
		first-ascent thresholds. The dashboard card shows a short recent list.
	</p>
</section>

<Milestones items={data.items} titleHref={null} dateDisplay={data.dateDisplay} />

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
</style>
