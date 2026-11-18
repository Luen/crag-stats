<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import RichText from '#lib/components/RichText.svelte';
	import { DEFAULT_DATE_DISPLAY, formatNumber, type DateDisplay } from '#lib/dates';
	import {
		MIN_RATE_ASCENTS,
		MIN_SIGNAL_DAYS,
		strongestRockSignal,
		type RockPerformanceBand,
		type RockPerformanceMetric,
		type RockPerformanceView,
		type RockRate
	} from '#lib/rockPerformance';

	type Props = { data: RockPerformanceView; dateDisplay?: DateDisplay };
	let { data, dateDisplay = DEFAULT_DATE_DISPLAY }: Props = $props();
	const i18n = useI18n();

	const METRICS: { key: RockPerformanceMetric; labelKey: string; helpKey: string }[] = [
		{
			key: 'sendRate',
			labelKey: 'cards.rockPerformance.labelSendRate',
			helpKey: 'cards.rockPerformance.helpSendRate'
		},
		{
			key: 'nearLimit',
			labelKey: 'cards.rockPerformance.labelNearLimit',
			helpKey: 'cards.rockPerformance.helpNearLimit'
		},
		{
			key: 'onsightFlash',
			labelKey: 'cards.rockPerformance.labelOnsightFlash',
			helpKey: 'cards.rockPerformance.helpOnsightFlash'
		}
	];

	let metric = $state<RockPerformanceMetric>('sendRate');

	const metricDef = $derived(METRICS.find((m) => m.key === metric)!);
	const overall = $derived(data.overall[metric]);
	const standout = $derived(strongestRockSignal(data.bands, metric));

	const fmt = (n: number) => formatNumber(n, dateDisplay);
	const coverageNote = $derived(
		data.allAscents > data.ascents
			? ` ${i18n.t('cards.rockPerformance.noteUntaggedSends', {
					count: fmt(data.allAscents - data.ascents)
				})}`
			: ''
	);

	function rateText(rate: RockRate): string {
		return rate.pct == null ? '—' : `${fmt(rate.pct)}%`;
	}

	function sampleText(rate: RockRate): string {
		return i18n.t('cards.rockPerformance.sampleCountOfTotal', {
			count: fmt(rate.count),
			total: fmt(rate.total)
		});
	}
</script>

<article class="panel rock-performance">
	<header>
		<h2>{i18n.t('cards.rockPerformance.titleRockPerformance')}</h2>
		<a class="how" href="/docs/rock-types">{i18n.t('common.howItWorks')}</a>
	</header>

	{#if !data.ready}
		<p class="lead">
			{i18n.t('cards.rockPerformance.leadNotReady', {
				minDays: fmt(data.minDays),
				days: fmt(data.days)
			})}
		</p>
	{:else}
		<p class="lead">
			{i18n.t('cards.rockPerformance.leadCounts', {
				ascents: fmt(data.ascents),
				days: fmt(data.days),
				rockCount: data.rockCount,
				coverage: coverageNote
			})}
		</p>

		<div
			class="toggles"
			role="group"
			aria-label={i18n.t('cards.rockPerformance.ariaPerformanceMeasure')}
		>
			{#each METRICS as m (m.key)}
				<button
					type="button"
					class={{ active: metric === m.key }}
					aria-pressed={metric === m.key}
					onclick={() => (metric = m.key)}
				>
					{i18n.t(m.labelKey)}
				</button>
			{/each}
		</div>
		<p class="hint">{i18n.t(metricDef.helpKey)}</p>

		<p class="summary" aria-live="polite">
			{#if standout}
				{@const r = standout[metric]}
				<RichText
					message={i18n.t(
						r.signal === 'higher'
							? 'cards.rockPerformance.summaryHigher'
							: 'cards.rockPerformance.summaryLower',
						{
							metric: i18n.t(metricDef.labelKey),
							rock: standout.label,
							percent: fmt(r.pct!),
							other: fmt(Math.round((r.pct! - r.diffPts!) * 10) / 10)
						}
					)}
				/>
			{:else}
				{i18n.t('cards.rockPerformance.summaryNoStandout')}
			{/if}
		</p>

		{#snippet bandBody(band: RockPerformanceBand)}
			{@const r = band[metric]}
			<span class="label">{band.label}</span>
			<span class="value">
				{#if r.pct == null}
					{i18n.t('cards.rockPerformance.valueNotEnoughData', { count: band.ascents })}
				{:else}
					{fmt(r.pct)}% · {sampleText(r)}
				{/if}
				{#if r.signal}
					<span class="signal {r.signal}">
						{r.signal === 'higher'
							? i18n.t('cards.rockPerformance.labelHigher')
							: i18n.t('cards.rockPerformance.labelLower')}
					</span>
				{/if}
			</span>
			<div class="track" aria-hidden="true">
				{#if r.pct != null}
					<div class="fill" class:faded={!r.signal} style:width="{r.pct}%"></div>
				{/if}
				{#if overall != null}
					<div class="overall" style:left="{overall}%"></div>
				{/if}
			</div>
		{/snippet}

		<ul class="bands">
			{#each data.bands as band (band.id)}
				<li>
					{#if band.href}
						<a class="row" href={band.href}>{@render bandBody(band)}</a>
					{:else}
						<div class="row">{@render bandBody(band)}</div>
					{/if}
				</li>
			{/each}
		</ul>

		<p class="hint">
			{#if overall != null}
				{i18n.t('cards.rockPerformance.hintOverallLine', {
					metric: i18n.t(metricDef.labelKey).toLowerCase(),
					percent: fmt(overall)
				})}
			{/if}
			{i18n.t('cards.rockPerformance.hintSignalThreshold', {
				minAscents: fmt(MIN_RATE_ASCENTS),
				minDays: fmt(MIN_SIGNAL_DAYS)
			})}
		</p>

		<details class="values">
			<summary>{i18n.t('cards.rockPerformance.summaryViewValues')}</summary>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				class="table-wrap"
				tabindex="0"
				role="region"
				aria-label={i18n.t('cards.rockPerformance.ariaRockPerformanceValues')}
			>
				<table>
					<caption>{i18n.t('cards.rockPerformance.captionSendsByRock')}</caption>
					<thead>
						<tr>
							<th scope="col">{i18n.t('cards.rockPerformance.thRock')}</th>
							<th scope="col">{i18n.t('cards.rockPerformance.thDays')}</th>
							{#each METRICS as m (m.key)}
								<th scope="col">{i18n.t(m.labelKey)}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each data.bands as band (band.id)}
							<tr>
								<th scope="row">{band.label}</th>
								<td>{fmt(band.days)}</td>
								{#each METRICS as m (m.key)}
									{@const r = band[m.key]}
									<td>
										{rateText(r)}
										<span class="n">({sampleText(r)})</span>
										{#if r.signal}<span class="visually-hidden">
												{r.signal === 'higher'
													? i18n.t('cards.rockPerformance.visuallyHiddenHigher')
													: i18n.t('cards.rockPerformance.visuallyHiddenLower')}
											</span>{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</details>
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
	.lead {
		margin: 0 0 0.75rem;
		color: var(--ink-muted);
		font-size: 0.92rem;
	}
	.toggles {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.toggles button {
		font: inherit;
		font-size: 0.82rem;
		padding: 0.3rem 0.6rem;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		background: var(--paper);
		color: var(--ink-muted);
		cursor: pointer;
	}
	.toggles button.active {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
	}
	.toggles button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.summary {
		margin: 0.75rem 0;
		padding: 0.65rem 0.85rem;
		border-radius: 0.75rem;
		background: var(--surface-2);
		font-size: 0.9rem;
	}
	.bands {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.55rem;
	}
	.row {
		color: inherit;
		text-decoration: none;
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.2rem 0.75rem;
		font-size: 0.88rem;
	}
	a.row:hover .label {
		text-decoration: underline;
	}
	a.row:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 4px;
		border-radius: 3px;
	}
	.label {
		font-weight: 600;
	}
	.value {
		color: var(--ink-muted);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
	.signal {
		margin-left: 0.35rem;
		padding: 0.05rem 0.4rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--ink);
		white-space: nowrap;
	}
	.signal.higher {
		background: color-mix(in srgb, var(--weather-fair) 30%, transparent);
	}
	.signal.lower {
		background: color-mix(in srgb, var(--weather-heat) 30%, transparent);
	}
	.track {
		position: relative;
		grid-column: 1 / -1;
		height: 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: var(--accent-2);
	}
	.fill.faded {
		opacity: 0.55;
	}
	.overall {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 2px;
		margin-left: -1px;
		background: var(--ink);
	}
	.hint {
		margin: 0.6rem 0 0;
		font-size: 0.78rem;
		color: var(--ink-muted);
	}
	.values {
		margin-top: 0.6rem;
		font-size: 0.82rem;
	}
	.values summary {
		cursor: pointer;
		color: var(--ink-muted);
	}
	.table-wrap {
		overflow-x: auto;
	}
	.table-wrap:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 0.4rem;
	}
	caption {
		text-align: left;
		color: var(--ink-muted);
		padding-bottom: 0.3rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.3rem 0.4rem;
		border-bottom: 1px solid var(--line);
		font-variant-numeric: tabular-nums;
	}
	.n {
		color: var(--ink-muted);
		font-size: 0.75rem;
	}
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
