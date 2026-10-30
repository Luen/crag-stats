<script lang="ts">
	import PartnerLeaderboard from '#lib/components/PartnerLeaderboard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<section class="panel head">
	<div class="copy">
		<h1>Partners</h1>
		<p>
			Everyone you've climbed with. Rank by shared ascents, climbing days, or distinct crags — click
			a name to filter the logbook.
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
