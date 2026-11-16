<script lang="ts">
	import { monthLabels, useI18n } from '#lib/i18n';
	import type { BestMonthsView } from '#lib/types/dashboard';

	let { data }: { data: BestMonthsView } = $props();
	const i18n = useI18n();
	const t = i18n.t;
	const MONTHS = $derived(monthLabels(t));

	function maxOf(values: number[]): number {
		return Math.max(1, ...values);
	}
</script>

<article class="panel">
	<header>
		<h2>{i18n.t('cards.bestMonths.titleBestMonths')}</h2>
		<a class="how" href="/seasonality">{t('cards.bestMonths.linkSearchSeasonality')}</a>
		<a class="how" href="/docs/best-months">{i18n.t('common.howItWorks')}</a>
	</header>
	<p class="lead">{i18n.t('cards.bestMonths.lead')}</p>

	<ul class="crags">
		{#each data.crags as c (c.crag)}
			{@const maxSeason = maxOf(c.seasonality)}
			{@const maxYours = maxOf(c.yourMonths)}
			<li>
				<div class="crag-head">
					{#if c.url}
						<a class="name" href={c.url} rel="noopener noreferrer">{c.crag}</a>
					{:else}
						<span class="name">{c.crag}</span>
					{/if}
					<span class="meta"
						>{t('cards.bestMonths.cragMeta', {
							count: c.ascentCount,
							month: MONTHS[c.peakMonth] ?? ''
						})}</span
					>
				</div>
				<div class="strip" aria-hidden="true">
					{#each MONTHS as label, i (label)}
						<div
							class="col"
							title={t('cards.bestMonths.monthTitle', {
								month: label,
								season: c.seasonality[i].toFixed(1),
								yours: c.yourMonths[i]
							})}
						>
							<div class="bars">
								<span class="bar season" style:height="{(c.seasonality[i] / maxSeason) * 100}%"
								></span>
								<span class="bar yours" style:height="{(c.yourMonths[i] / maxYours) * 100}%"></span>
							</div>
							<span class="m">{label.slice(0, 1)}</span>
						</div>
					{/each}
				</div>
				<details class="values">
					<summary>{t('cards.bestMonths.summaryViewMonthlyValues', { crag: c.crag })}</summary>
					<table>
						<caption
							>{t('cards.bestMonths.captionSeasonalityAndYourAscents', { crag: c.crag })}</caption
						><thead
							><tr
								><th scope="col">{t('cards.bestMonths.thMonth')}</th><th scope="col"
									>{t('cards.bestMonths.thSeasonality')}</th
								><th scope="col">{t('cards.bestMonths.thYourAscents')}</th></tr
							></thead
						><tbody>
							{#each MONTHS as label, i (label)}<tr
									><th scope="row">{label}</th><td>{c.seasonality[i].toFixed(1)}</td><td
										>{c.yourMonths[i]}</td
									></tr
								>{/each}
						</tbody>
					</table>
				</details>
			</li>
		{/each}
	</ul>

	<div class="legend">
		<span><i class="sw season"></i> {t('cards.bestMonths.legendTheCragSeasonality')}</span>
		<span><i class="sw yours"></i> {t('cards.bestMonths.legendYourAscents')}</span>
	</div>
</article>

<style>
	.values {
		margin-top: 0.5rem;
		font-size: 0.85rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		text-align: left;
		padding: 0.35rem 0.5rem;
		border-bottom: 1px solid var(--line);
	}
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	.lead {
		margin: 0 0 1rem;
		font-size: 0.88rem;
		color: var(--ink-muted);
	}
	.crags {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1.25rem;
	}
	.crag-head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.35rem 0.75rem;
		margin-bottom: 0.45rem;
	}
	.name {
		font-weight: 700;
		color: var(--ink);
	}
	a.name:hover {
		color: var(--accent);
	}
	.meta {
		font-size: 0.78rem;
		color: var(--ink-muted);
	}
	.strip {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 0.2rem;
	}
	.col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		min-width: 0;
	}
	.bars {
		display: flex;
		align-items: flex-end;
		justify-content: center;
		gap: 2px;
		width: 100%;
		height: 3.5rem;
	}
	.bar {
		width: 42%;
		min-height: 2px;
		border-radius: 2px 2px 0 0;
	}
	.bar.season {
		background: var(--accent);
	}
	.bar.yours {
		background: color-mix(in srgb, var(--ink) 28%, var(--paper));
	}
	.m {
		font-size: 0.62rem;
		font-weight: 700;
		color: var(--ink-muted);
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.25rem;
		margin-top: 1rem;
		font-size: 0.78rem;
		color: var(--ink-muted);
	}
	.sw {
		display: inline-block;
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 2px;
		margin-right: 0.35rem;
		vertical-align: -0.05em;
	}
	.sw.season {
		background: var(--accent);
	}
	.sw.yours {
		background: color-mix(in srgb, var(--ink) 28%, var(--paper));
	}
</style>
