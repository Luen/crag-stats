<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import RichText from '#lib/components/RichText.svelte';
	import { DEFAULT_DATE_DISPLAY, formatNumber, type DateDisplay } from '#lib/dates';
	import {
		MIN_RATE_ASCENTS,
		MIN_SIGNAL_DAYS,
		strongestSignal,
		type WeatherPerformanceBand,
		type WeatherPerformanceDimension,
		type WeatherPerformanceMetric,
		type WeatherPerformanceView,
		type WeatherRate
	} from '#lib/weatherPerformance';

	type Props = { data: WeatherPerformanceView; dateDisplay?: DateDisplay; compact?: boolean };
	let { data, dateDisplay = DEFAULT_DATE_DISPLAY, compact = true }: Props = $props();
	const i18n = useI18n();

	const METRICS: { key: WeatherPerformanceMetric; labelKey: string; helpKey: string }[] = [
		{
			key: 'sendRate',
			labelKey: 'cards.weatherPerformance.labelSendRate',
			helpKey: 'cards.weatherPerformance.helpSendRate'
		},
		{
			key: 'nearLimit',
			labelKey: 'cards.weatherPerformance.labelNearLimit',
			helpKey: 'cards.weatherPerformance.helpNearLimit'
		},
		{
			key: 'onsightFlash',
			labelKey: 'cards.weatherPerformance.labelOnsightFlash',
			helpKey: 'cards.weatherPerformance.helpOnsightFlash'
		}
	];

	let dashboardDimension = $state<WeatherPerformanceDimension>('temperature');
	let dashboardMetric = $state<WeatherPerformanceMetric>('sendRate');
	const summaryGroup = $derived(data.groups.find((g) => g.key === 'temperature'));
	const summarySignal = $derived(summaryGroup ? strongestSignal(summaryGroup, 'sendRate') : null);
	const showDetails = $derived(!compact || !summarySignal);
	const dimension = $derived<WeatherPerformanceDimension>(
		compact
			? showDetails
				? dashboardDimension
				: 'temperature'
			: page.url.searchParams.get('group') === 'conditions'
				? 'conditions'
				: 'temperature'
	);
	const metric = $derived<WeatherPerformanceMetric>(
		compact
			? showDetails
				? dashboardMetric
				: 'sendRate'
			: page.url.searchParams.get('measure') === 'nearLimit'
				? 'nearLimit'
				: page.url.searchParams.get('measure') === 'onsightFlash'
					? 'onsightFlash'
					: 'sendRate'
	);
	function select(
		key: 'group' | 'measure',
		value: WeatherPerformanceDimension | WeatherPerformanceMetric
	) {
		if (compact) {
			if (key === 'group') dashboardDimension = value as WeatherPerformanceDimension;
			else dashboardMetric = value as WeatherPerformanceMetric;
			return;
		}
		const url = new URL(page.url.href);
		url.searchParams.set(key, value);
		void goto(url, { reset: false });
	}

	const group = $derived(data.groups.find((g) => g.key === dimension) ?? data.groups[0]);
	const metricDef = $derived(METRICS.find((m) => m.key === metric)!);
	const overall = $derived(data.overall[metric]);
	const standout = $derived(group ? strongestSignal(group, metric) : null);

	const fmt = (n: number) => formatNumber(n, dateDisplay);
	// Leading spaces live in the strings: Svelte trims whitespace at the start of {#if} blocks.
	const uncachedNote = $derived(
		data.outdoorAscents > data.ascents
			? ` ${i18n.t('cards.weatherPerformance.noteUncachedSends', {
					count: fmt(data.outdoorAscents - data.ascents)
				})}`
			: ''
	);
	const approximateNote = $derived(
		data.approximateAscents > 0
			? ` ${i18n.t('cards.weatherPerformance.noteApproximateWeather', {
					count: data.approximateAscents
				})}`
			: ''
	);

	const GROUP_LABEL_KEYS: Record<WeatherPerformanceDimension, string> = {
		temperature: 'cards.weatherPerformance.groupDailyHigh',
		conditions: 'cards.weatherPerformance.groupConditions'
	};

	const COND_BAND_KEYS: Record<string, string> = {
		'cond:fair': 'cards.weatherPerformance.bandFair',
		'cond:dry': 'cards.weatherPerformance.bandDry',
		'cond:rain': 'cards.weatherConditions.shareRain',
		'cond:snow': 'cards.weatherConditions.shareSnow',
		'cond:heat': 'cards.weatherConditions.shareHeat',
		'cond:freeze': 'cards.weatherConditions.shareFreeze',
		'cond:calm': 'cards.weatherPerformance.bandCalm',
		'cond:wind': 'cards.weatherPerformance.bandWindy'
	};

	function groupLabel(key: WeatherPerformanceDimension, fallback: string): string {
		const k = GROUP_LABEL_KEYS[key];
		return k ? i18n.t(k) : fallback;
	}

	function bandLabel(band: WeatherPerformanceBand): string {
		// Temperature labels are already localised by the server builder.
		const key = COND_BAND_KEYS[band.id];
		return key ? i18n.t(key) : band.label;
	}

	function daysPhrase(band: WeatherPerformanceBand): string {
		const label = bandLabel(band);
		if (dimension === 'conditions')
			return i18n.t('cards.weatherPerformance.daysAfterLabel', {
				label: label.toLocaleLowerCase(i18n.locale)
			});
		return band.id === 'temp:lt'
			? i18n.t('cards.weatherPerformance.daysBeforeLabel', {
					label: label.toLocaleLowerCase(i18n.locale)
				})
			: i18n.t('cards.weatherPerformance.daysAfterLabel', { label });
	}

	function rateText(rate: WeatherRate): string {
		return rate.pct == null ? '—' : `${fmt(rate.pct)}%`;
	}

	function sampleText(rate: WeatherRate): string {
		return i18n.t('cards.weatherPerformance.sampleCountOfTotal', {
			count: fmt(rate.count),
			total: fmt(rate.total)
		});
	}
</script>

<article class="panel weather-performance">
	<header>
		<h2>
			{#if compact}<a href="/weather#performance"
					>{i18n.t('cards.weatherPerformance.titleWeatherAndPerformance')}</a
				>{:else}{i18n.t('cards.weatherPerformance.titleWeatherAndPerformance')}{/if}
		</h2>
		<a class="how" href="/docs/weather">{i18n.t('common.howItWorks')}</a>
	</header>

	{#if !data.ready || !group}
		<p class="lead">
			{i18n.t('cards.weatherPerformance.leadNotReady', {
				minDays: fmt(data.minDays),
				days: fmt(data.days),
				approximate: approximateNote
			})}
		</p>
	{:else}
		<p class="lead">
			{i18n.t('cards.weatherPerformance.leadCounts', {
				ascents: fmt(data.ascents),
				days: fmt(data.days),
				uncached: uncachedNote,
				approximate: approximateNote
			})}
		</p>

		{#if showDetails}
			<div class="controls">
				<div
					class="toggles"
					role="group"
					aria-label={i18n.t('cards.weatherPerformance.ariaWeatherGrouping')}
				>
					{#each data.groups as g (g.key)}
						<button
							type="button"
							class={{ active: dimension === g.key }}
							aria-pressed={dimension === g.key}
							onclick={() => select('group', g.key)}>{groupLabel(g.key, g.label)}</button
						>
					{/each}
				</div>
				<div
					class="toggles"
					role="group"
					aria-label={i18n.t('cards.weatherPerformance.ariaPerformanceMeasure')}
				>
					{#each METRICS as m (m.key)}
						<button
							type="button"
							class={{ active: metric === m.key }}
							aria-pressed={metric === m.key}
							onclick={() => select('measure', m.key)}>{i18n.t(m.labelKey)}</button
						>
					{/each}
				</div>
			</div>
			<p class="hint">{i18n.t(metricDef.helpKey)}</p>
		{:else}
			<p class="hint">
				{overall == null
					? i18n.t('cards.weatherPerformance.hintDailyHighSendRate')
					: i18n.t('cards.weatherPerformance.hintDailyHighSendRateOverall', {
							percent: fmt(overall)
						})}
			</p>
		{/if}

		<p class="summary" aria-live="polite">
			{#if standout}
				{@const r = standout[metric]}
				<RichText
					message={i18n.t(
						r.signal === 'higher'
							? 'cards.weatherPerformance.summaryHigher'
							: 'cards.weatherPerformance.summaryLower',
						{
							metric: i18n.t(metricDef.labelKey),
							days: daysPhrase(standout),
							percent: fmt(r.pct!),
							other: fmt(Math.round((r.pct! - r.diffPts!) * 10) / 10)
						}
					)}
				/>
			{:else if !showDetails}
				{i18n.t('cards.weatherPerformance.summaryNoPattern')}
			{:else}
				{i18n.t('cards.weatherPerformance.summaryNoStandout')}
			{/if}
		</p>

		{#if showDetails}
			{#snippet bandBody(band: WeatherPerformanceBand)}
				{@const r = band[metric]}
				<span class="label">{bandLabel(band)}</span>
				<span class="value">
					{#if r.pct == null}
						{i18n.t('cards.weatherPerformance.valueNotEnoughData', { count: band.ascents })}
					{:else}
						{fmt(r.pct)}% · {sampleText(r)}
					{/if}
					{#if r.signal}
						<span class="signal {r.signal}"
							>{r.signal === 'higher'
								? i18n.t('cards.weatherPerformance.labelHigher')
								: i18n.t('cards.weatherPerformance.labelLower')}</span
						>
					{/if}
				</span>
				<div class="track" aria-hidden="true">
					{#if r.pct != null}
						<div class={['fill', { faded: !r.signal }]} style:width="{r.pct}%"></div>
					{/if}
					{#if overall != null}
						<div class="overall" style:left="{overall}%"></div>
					{/if}
				</div>
			{/snippet}

			<ul class="bands">
				{#each group.bands as band (band.id)}
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
					{i18n.t('cards.weatherPerformance.hintOverallLine', {
						metric: i18n.t(metricDef.labelKey).toLowerCase(),
						percent: fmt(overall)
					})}
				{/if}
				{i18n.t('cards.weatherPerformance.hintSignalThreshold', {
					minAscents: fmt(MIN_RATE_ASCENTS),
					minDays: fmt(MIN_SIGNAL_DAYS)
				})}
				{#if group.overlapping}{i18n.t('cards.weatherPerformance.hintOverlapping')}{/if}
				{i18n.t('cards.weatherPerformance.hintPatternNotCause')}
			</p>

			<details class="values">
				<summary>{i18n.t('cards.weatherPerformance.summaryViewValues')}</summary>
				<!-- Scrollable region: focusable so keyboard users can scroll it (axe). -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					class="table-wrap"
					tabindex="0"
					role="region"
					aria-label={i18n.t('cards.weatherPerformance.ariaBandValues', {
						group: groupLabel(group.key, group.label)
					})}
				>
					<table>
						<caption>
							{i18n.t('cards.weatherPerformance.captionSendsByWeather', {
								group: groupLabel(group.key, group.label)
							})}
						</caption>
						<thead>
							<tr>
								<th scope="col">{i18n.t('cards.weatherPerformance.thBand')}</th>
								<th scope="col">{i18n.t('cards.weatherPerformance.thDays')}</th>
								{#each METRICS as m (m.key)}
									<th scope="col">{i18n.t(m.labelKey)}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each group.bands as band (band.id)}
								<tr>
									<th scope="row">{bandLabel(band)}</th>
									<td>{fmt(band.days)}</td>
									{#each METRICS as m (m.key)}
										{@const r = band[m.key]}
										<td>
											{rateText(r)}
											<span class="n">({sampleText(r)})</span>
											{#if r.signal}<span class="visually-hidden"
													>{r.signal === 'higher'
														? i18n.t('cards.weatherPerformance.visuallyHiddenHigher')
														: i18n.t('cards.weatherPerformance.visuallyHiddenLower')}</span
												>{/if}
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</details>
		{:else}
			<p class="hint">{i18n.t('cards.weatherPerformance.hint')}</p>
			{#if standout?.href}<p>
					<a href={standout.href}>{i18n.t('cards.weatherPerformance.linkViewQualifyingAscents')}</a>
				</p>{/if}
		{/if}
	{/if}
	{#if compact}<p>
			<a href="/weather#performance"
				>{i18n.t('cards.weatherPerformance.linkExploreWeatherPerformance')}</a
			>
		</p>{/if}
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
	h2 a {
		color: inherit;
		text-decoration: none;
	}
	h2 a:hover {
		text-decoration: underline;
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
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
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
