<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import PartnerLeaderboard from '#lib/components/PartnerLeaderboard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<section class="panel head">
	<div class="copy">
		<h1>{i18n.t('pages.partners.titlePartners')}</h1>
		<p>
			{i18n.t('pages.partners.lead')}
		</p>
	</div>
</section>

<PartnerLeaderboard preferences={data.cardPreferences} partners={data.partners} metricToggle />

<style>
	.head {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
		margin-bottom: 0.9rem;
	}
	.copy {
		max-width: 40rem;
	}
	h1 {
		margin: 0 0 0.35rem;
		font-size: 1.45rem;
	}
	p {
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.92rem;
	}
</style>
