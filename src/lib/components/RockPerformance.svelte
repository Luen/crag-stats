<script lang="ts">
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

	const METRICS: { key: RockPerformanceMetric; label: string; help: string }[] = [
		{
			key: 'sendRate',
			label: 'Send rate',
			help: 'Sends as a share of your logged sends and attempts on tagged rock.'
		},
		{
			key: 'nearLimit',
			label: 'Near-limit',
			help: 'Sends within 2 grades (1 V-grade) of your hardest same-style send in the year before.'
		},
		{
			key: 'onsightFlash',
			label: 'Onsight/flash',
			help: 'Onsights and flashes as a share of your sends on that rock.'
		}
	];

	let metric = $state<RockPerformanceMetric>('sendRate');

	const metricDef = $derived(METRICS.find((m) => m.key === metric)!);
	const overall = $derived(data.overall[metric]);
	const standout = $derived(strongestRockSignal(data.bands, metric));

	const fmt = (n: number) => formatNumber(n, dateDisplay);
	const coverageNote = $derived(
		data.allAscents > data.ascents
			? ` (${fmt(data.allAscents - data.ascents)} more sends and attempts have no rock type tag)`
			: ''
	);

	function rateText(rate: RockRate): string {
		return rate.pct == null ? '—' : `${fmt(rate.pct)}%`;
	}

	function sampleText(rate: RockRate): string {
		return `${fmt(rate.count)} of ${fmt(rate.total)}`;
	}
</script>

<article class="panel rock-performance">
	<header>
		<h2>Rock &amp; performance</h2>
		<a class="how" href="/docs/rock-types">How it works</a>
	</header>

	{#if !data.ready}
		<p class="lead">
			This card compares your sends across rock types once {fmt(data.minDays)} climbing days have a Rock
			type tag. So far: {fmt(data.days)}.
		</p>
	{:else}
		<p class="lead">
			{fmt(data.ascents)} sends and attempts with a Rock type tag across {fmt(data.days)} days and
			{fmt(data.rockCount)} rock{data.rockCount === 1 ? '' : 's'}{coverageNote}.
		</p>

		<div class="toggles" role="group" aria-label="Performance measure">
			{#each METRICS as m (m.key)}
				<button
					type="button"
					class={{ active: metric === m.key }}
					aria-pressed={metric === m.key}
					onclick={() => (metric = m.key)}>{m.label}</button
				>
			{/each}
		</div>
		<p class="hint">{metricDef.help}</p>

		<p class="summary" aria-live="polite">
			{#if standout}
				{@const r = standout[metric]}
				{metricDef.label} is <strong>{r.signal === 'higher' ? 'higher' : 'lower'}</strong> on
				{standout.label}: {fmt(r.pct!)}% vs {fmt(Math.round((r.pct! - r.diffPts!) * 10) / 10)}% on
				your other rock.
			{:else}
				No rock type stands out from your other tagged climbs yet; the differences below are within
				normal day-to-day variation.
			{/if}
		</p>

		{#snippet bandBody(band: RockPerformanceBand)}
			{@const r = band[metric]}
			<span class="label">{band.label}</span>
			<span class="value">
				{#if r.pct == null}
					Not enough data · {fmt(band.ascents)}
					{band.ascents === 1 ? 'ascent' : 'ascents'}
				{:else}
					{fmt(r.pct)}% · {sampleText(r)}
				{/if}
				{#if r.signal}
					<span class="signal {r.signal}">{r.signal === 'higher' ? '↑ Higher' : '↓ Lower'}</span>
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
				Overall {metricDef.label.toLowerCase()} on tagged rock: {fmt(overall)}% (the line on each
				bar).
			{/if}
			“Higher” or “Lower” marks a rock that differs from your other tagged days by more than day-to-day
			variation explains, with at least {fmt(MIN_RATE_ASCENTS)} ascents over
			{fmt(MIN_SIGNAL_DAYS)} days on each side. Crag choice and trips confound rock type, so treat this
			as a pattern, not a cause.
		</p>

		<details class="values">
			<summary>View values</summary>
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div class="table-wrap" tabindex="0" role="region" aria-label="Rock performance values">
				<table>
					<caption>Rock types: sends by rock (count of total)</caption>
					<thead>
						<tr>
							<th scope="col">Rock</th>
							<th scope="col">Days</th>
							{#each METRICS as m (m.key)}
								<th scope="col">{m.label}</th>
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
										{#if r.signal}<span class="visually-hidden">, {r.signal} than other rock</span
											>{/if}
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
	.how {
		font-size: 0.85rem;
		color: var(--ink-muted);
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
