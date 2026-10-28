<script lang="ts">
	import { formatNumber, DEFAULT_DATE_DISPLAY, type DateDisplay } from '#lib/dates';
	import type { KarmaStats } from '#lib/types/karma';

	type Props = { data: KarmaStats; dateDisplay?: DateDisplay };
	let { data, dateDisplay = DEFAULT_DATE_DISPLAY }: Props = $props();
</script>

<article class="panel">
	<header>
		<h2>Karma</h2>
		<a class="how" href="/docs/karma">How it works</a>
	</header>

	<p class="lead">
		Approximate theCrag contribution score from your logbook. Ascents use their once-per-route rule;
		guide-edit points are not in the logbook API yet.
	</p>

	<div class="tiles">
		<div class="tile">
			<strong>{formatNumber(data.totalPoints, dateDisplay)}</strong>
			<span>ascent karma (approx)</span>
		</div>
		<div class="tile">
			<strong>{formatNumber(data.ascentPoints, dateDisplay)}</strong>
			<span
				>from {formatNumber(data.routesLogged, dateDisplay)} local route{data.routesLogged === 1
					? ''
					: 's'}</span
			>
		</div>
		<div class="tile muted">
			<strong>—</strong>
			<span>edit karma unavailable</span>
		</div>
	</div>

	<p class="foot">
		1 point per distinct route logged (theCrag “Log Ascent”).
		{#if data.ascentSource === 'account'}
			Ascent total uses your theCrag <code>routesTicked</code> account figure.
		{/if}
		Real karma also waits in a review queue (~1 week) and includes guide edits we cannot see yet.
		<a href="https://www.thecrag.com/article/cragkarma" target="_blank" rel="noreferrer"
			>theCrag Karma article</a
		>.
	</p>
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.how {
		font-size: 0.82rem;
		color: var(--ink-muted);
		text-decoration: underline;
		text-underline-offset: 0.15em;
		white-space: nowrap;
	}
	.lead {
		margin: 0 0 0.85rem;
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
		gap: 0.55rem;
	}
	.tile {
		border: 1px solid var(--line);
		border-top: 3px solid var(--accent);
		border-radius: 0.65rem;
		padding: 0.65rem 0.6rem;
		text-align: center;
		background: var(--paper);
	}
	.tile.muted {
		border-top-color: var(--line);
	}
	.tile strong {
		display: block;
		font-size: 1.45rem;
		line-height: 1.15;
		font-family: var(--font-display);
	}
	.tile span {
		color: var(--ink-muted);
		font-size: 0.8rem;
	}
	.foot {
		margin: 0.85rem 0 0;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
	.foot a,
	.foot code {
		color: inherit;
	}
	.foot a {
		text-decoration: underline;
	}
</style>
