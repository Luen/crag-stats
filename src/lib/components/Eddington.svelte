<script lang="ts">
	import type { EddingtonStats } from '#lib/types/dashboard';

	type Props = { data: EddingtonStats };
	let { data }: Props = $props();

	const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

	const tiles = $derived.by(() => {
		const { sends, vertical, routeGrade, boulderGrade, verticalUnitM: unit } = data;
		return [
			{
				key: 'sends',
				label: 'Send days',
				value: sends.value,
				means: `${plural(sends.value, 'day')} with ${sends.value}+ sends`,
				next: `${plural(sends.needed, 'more day')} of ${sends.next}+ sends for ${sends.next}`
			},
			{
				key: 'vertical',
				label: 'Vertical days',
				value: vertical.value,
				means: `${plural(vertical.value, 'day')} with ${vertical.value * unit}+ m climbed`,
				next: `${plural(vertical.needed, 'more day')} of ${vertical.next * unit}+ m for ${vertical.next}`
			},
			{
				key: 'routeGrade',
				label: 'Route grade index',
				value: routeGrade.value,
				means: `${plural(routeGrade.value, 'route')} sent at Ewbank ${routeGrade.value}+`,
				next: `${plural(routeGrade.needed, 'more route')} at ${routeGrade.next}+ for ${routeGrade.next}`
			},
			{
				key: 'boulderGrade',
				label: 'Boulder grade index',
				value: boulderGrade.value,
				means: `${plural(boulderGrade.value, 'problem')} sent at V${boulderGrade.value}+`,
				next: `${plural(boulderGrade.needed, 'more problem')} at V${boulderGrade.next}+ for ${boulderGrade.next}`
			}
		];
	});
</script>

<article class="panel">
	<h2>Eddington numbers</h2>
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
