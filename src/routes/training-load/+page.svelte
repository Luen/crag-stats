<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import TrainingLoad from '#lib/components/TrainingLoad.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<svelte:head>
	<title>{i18n.t('pages.trainingLoad.pageTitle')}</title>
	<meta name="description" content={i18n.t('pages.trainingLoad.pageDescription')} />
</svelte:head>

<section class="panel head">
	<h1>{i18n.t('pages.trainingLoad.titleTrainingLoad')}</h1>
	<p>
		{i18n.t('pages.trainingLoad.lead')}
		<a class="how" href="/docs/training-load">{i18n.t('common.howItWorks')}</a>
	</p>
</section>

<TrainingLoad
	load={data.trainingLoad}
	gradeSystems={data.gradeSystems}
	displayUnits={data.displayUnits}
	dateDisplay={data.dateDisplay}
	weeksShown={26}
	titleHref={null}
	showDaily
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
	}
</style>
