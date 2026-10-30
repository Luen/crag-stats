<script lang="ts">
	import { formatNumber, DEFAULT_DATE_DISPLAY, type DateDisplay } from '#lib/dates';
	import type { RoutePopularityStats } from '#lib/types/routePopularity';

	type Props = { data: RoutePopularityStats; dateDisplay?: DateDisplay };
	let { data, dateDisplay = DEFAULT_DATE_DISPLAY }: Props = $props();
</script>

<article class="panel">
	<header>
		<h2>Route popularity</h2>
		<a class="how" href="/docs/route-popularity">How it works</a>
	</header>

	<p class="lead">
		Among {formatNumber(data.withData, dateDisplay)} ascents with community stats, how often you tick
		busy classics vs quieter lines.
	</p>

	<div class="split">
		<div class="bucket busy">
			<span class="k">Beaten track</span>
			<strong>{data.busy.pct}%</strong>
			<span class="n">{formatNumber(data.busy.count, dateDisplay)} ticks</span>
			<div class="track" aria-hidden="true">
				<div class="fill" style:width="{data.busy.pct}%"></div>
			</div>
			<p class="hint">Popularity ≥ 50</p>
		</div>
		<div class="bucket quiet">
			<span class="k">Off the beaten track</span>
			<strong>{data.quiet.pct}%</strong>
			<span class="n">{formatNumber(data.quiet.count, dateDisplay)} ticks</span>
			<div class="track" aria-hidden="true">
				<div class="fill" style:width="{data.quiet.pct}%"></div>
			</div>
			<p class="hint">Popularity &lt; 50</p>
		</div>
	</div>

	{#if data.hiddenGems.length > 0}
		<section class="gems">
			<h3>Hidden gems you've sent</h3>
			<ul>
				{#each data.hiddenGems as gem (gem.routeId)}
					<li>
						<strong>
							{#if gem.url}
								<a href={gem.url} target="_blank" rel="noreferrer">{gem.routeName}</a>
							{:else}
								{gem.routeName}
							{/if}
						</strong>
						<span class="meta">
							{gem.gradeLabel ?? ''}{#if gem.cragName}
								· {gem.cragName}{/if}
							{#if gem.popularityLabel}
								· {gem.popularityLabel}{/if}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
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
		font-size: 0.85rem;
		color: var(--ink-muted);
	}
	.lead {
		margin: 0 0 1rem;
		color: var(--ink-muted);
		font-size: 0.92rem;
	}
	.split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	@media (max-width: 520px) {
		.split {
			grid-template-columns: 1fr;
		}
	}
	.bucket {
		padding: 0.85rem 1rem;
		border-radius: 0.75rem;
		background: var(--surface-2);
	}
	.k {
		font-size: 0.82rem;
		color: var(--ink-muted);
		font-weight: 600;
	}
	.bucket strong {
		font-size: 1.75rem;
	}
	.gems strong {
		font-size: 0.95rem;
	}
	.n {
		display: block;
		font-size: 0.85rem;
		color: var(--ink-muted);
		margin-bottom: 0.5rem;
	}
	.track {
		height: 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: var(--accent);
	}
	.quiet .fill {
		background: color-mix(in srgb, var(--ink) 35%, transparent);
	}
	.hint {
		margin: 0.45rem 0 0;
		font-size: 0.78rem;
		color: var(--ink-muted);
	}
	.gems {
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}
	h3 {
		margin: 0 0 0.75rem;
		font-size: 0.95rem;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}
	.meta {
		display: block;
		font-size: 0.85rem;
		color: var(--ink-muted);
		font-weight: 400;
	}
	a:hover {
		color: var(--accent);
	}
</style>
