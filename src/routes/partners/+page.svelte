<script lang="ts">
	import PartnerLeaderboard from '#lib/components/PartnerLeaderboard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<section class="panel head">
	<h1>Partners</h1>
	<p>Everyone you've climbed with, ranked by shared ascents. Click a name to filter the logbook.</p>
</section>

<PartnerLeaderboard partners={data.partners} />

<style>
	.head {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
		margin-bottom: 0.9rem;
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
