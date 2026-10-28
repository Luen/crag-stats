<script lang="ts">
	import { eddingtonTiles } from '#lib/eddingtonDisplay';
	import type { EddingtonStats } from '#lib/types/dashboard';

	type Props = { data: EddingtonStats };
	let { data }: Props = $props();

	const tiles = $derived(eddingtonTiles(data));
</script>

<article class="panel">
	<h2><a href="/eddington">Eddington numbers</a></h2>
	<div class="cards">
		{#each tiles as t (t.key)}
			<div class="card">
				<span class="label">{t.label}</span>
				<strong>{t.value}</strong>
				<span class="means">{t.means}</span>
				<span class="next">{t.next}</span>
			</div>
		{/each}
	</div>
	<p class="foot">
		Like cycling's Eddington number: the biggest E you've hit E times.
		<a href="/docs/eddington">How it works</a>
	</p>
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	h2 a {
		color: inherit;
		text-decoration: none;
	}
	h2 a:hover {
		color: var(--accent);
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
		gap: 0.55rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		border: 1px solid var(--line);
		border-radius: 0.65rem;
		padding: 0.75rem 0.7rem 0.65rem;
		background: var(--paper);
		border-top: 3px solid var(--accent-2);
	}
	.card strong {
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
	.foot {
		margin: 0.7rem 0 0;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
</style>
