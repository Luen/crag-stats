<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import {
		DEFAULT_DATE_DISPLAY,
		formatCalendarDate,
		formatNumber,
		type DateDisplay
	} from '#lib/dates';
	import {
		histogramBinHref,
		histogramBinLabel,
		type WeatherConditionsView,
		type WeatherExtreme
	} from '#lib/weatherStats';
	import { DEFAULT_DISPLAY_UNITS, formatTemperature, type DisplayUnits } from '#lib/units';
	import BarList from './BarList.svelte';
	import RichText from './RichText.svelte';

	type Props = {
		data: WeatherConditionsView;
		dateDisplay?: DateDisplay;
		displayUnits?: DisplayUnits;
		compact?: boolean;
	};
	let {
		data,
		dateDisplay = DEFAULT_DATE_DISPLAY,
		displayUnits = DEFAULT_DISPLAY_UNITS,
		compact = true
	}: Props = $props();
	const i18n = useI18n();

	const SHARE_COLORS: Record<string, string> = {
		perfect: 'var(--accent-2)',
		rain: 'var(--style-sport)',
		snow: 'var(--ink-muted)',
		freeze: 'var(--style-boulder)',
		heat: 'var(--accent)'
	};

	const FAIR_LABEL_KEYS = {
		'fair-leaning': 'cards.weatherConditions.labelFairLeaning',
		'all-weather': 'cards.weatherConditions.labelAllWeather',
		mixed: 'cards.weatherConditions.labelMixed'
	} as const;

	const SHARE_LABEL_KEYS: Record<string, string> = {
		perfect: 'cards.weatherConditions.sharePerfect',
		rain: 'cards.weatherConditions.shareRain',
		snow: 'cards.weatherConditions.shareSnow',
		freeze: 'cards.weatherConditions.shareFreeze',
		heat: 'cards.weatherConditions.shareHeat'
	};

	const withoutNote = $derived(
		data.withoutWeather > 0
			? ` ${i18n.t('cards.weatherConditions.noteWithoutUsableWeather', {
					count: formatNumber(data.withoutWeather, dateDisplay)
				})}`
			: ''
	);
	const fairRange = $derived(
		i18n.t(
			displayUnits.temperature === 'fahrenheit'
				? 'cards.weatherConditions.rangeFairImperial'
				: 'cards.weatherConditions.rangeFairMetric'
		)
	);

	const histogram = $derived(
		data.histogram.map((b, index) => ({
			href: histogramBinHref(index),
			id: b.id,
			label: histogramBinLabel(index, displayUnits.temperature),
			value: b.days,
			color: 'var(--accent-2)'
		}))
	);
</script>

{#snippet extreme(title: string, e: WeatherExtreme | null)}
	<div class="extreme">
		<span class="k">{title}</span>
		{#if e}
			<strong>{formatTemperature(e.tempC, displayUnits.temperature)}</strong>
			<span class="meta">
				{#if e.href}
					<a href={e.href} target="_blank" rel="noreferrer">
						{e.routeName ?? i18n.t('cards.weatherConditions.labelAscent')}
					</a>
				{:else}
					{e.routeName ?? i18n.t('cards.weatherConditions.labelAscent')}
				{/if}
				· {formatCalendarDate(e.date, dateDisplay)}
			</span>
		{:else}
			<strong>—</strong>
			<span class="meta">{i18n.t('cards.weatherConditions.labelNoData')}</span>
		{/if}
	</div>
{/snippet}

<article class="panel">
	<header>
		<h2>
			{#if compact}<a href="/weather#conditions">
					{i18n.t('cards.weatherConditions.titleWeatherConditions')}
				</a>{:else}{i18n.t('cards.weatherConditions.titleWeatherConditions')}{/if}
		</h2>
		<a class="how" href="/docs/weather">{i18n.t('common.howItWorks')}</a>
	</header>

	<p class="lead">
		{i18n.t('cards.weatherConditions.leadCached', {
			withWeather: formatNumber(data.withWeather, dateDisplay),
			outdoorDays: formatNumber(data.outdoorDays, dateDisplay),
			without: withoutNote
		})}
	</p>

	<div class="extremes">
		{@render extreme(i18n.t('cards.weatherConditions.labelHottestClimb'), data.hottest)}
		{@render extreme(i18n.t('cards.weatherConditions.labelColdestClimb'), data.coldest)}
	</div>

	{#if data.fairWeather}
		{@const f = data.fairWeather}
		<div class="fair">
			<span class="k">{i18n.t('cards.weatherConditions.labelFairWeatherRate')}</span>
			<strong>{formatNumber(f.fairPct, dateDisplay)}%</strong>
			<span class="meta">
				<RichText
					message={i18n.t('cards.weatherConditions.fairSummary', {
						label: i18n.t(FAIR_LABEL_KEYS[f.label]),
						fairDays: formatNumber(f.fairDays, dateDisplay),
						days: formatNumber(f.days, dateDisplay),
						range: fairRange,
						toughPct: formatNumber(f.toughPct, dateDisplay)
					})}
					tokens={{
						logbookLink: {
							kind: 'link',
							text: i18n.t('cards.weatherConditions.linkFairDaysInLogbook'),
							href: '/logbook?weather=fair'
						}
					}}
				/>
			</span>
		</div>
	{/if}

	<p class="hint">
		{i18n.t('cards.weatherConditions.hintLocationQuality')}
	</p>
	{#if !compact}
		<h3>{i18n.t('cards.weatherConditions.titleShareOfDays')}</h3>
		<ul class="shares">
			{#each data.shares as share (share.key)}
				<li>
					<a href={`/logbook?weather=${share.key}`}>
						<span class="label">
							{SHARE_LABEL_KEYS[share.key] ? i18n.t(SHARE_LABEL_KEYS[share.key]) : share.label}
						</span>
						<span class="value">
							{formatNumber(share.pct, dateDisplay)}% · {formatNumber(share.days, dateDisplay)}
							{i18n.t('cards.weatherConditions.unitDays', { count: share.days })}
						</span>
						<div class="track" aria-hidden="true">
							<div
								class="fill"
								style:width="{share.pct}%"
								style:background={SHARE_COLORS[share.key]}
							></div>
						</div>
					</a>
				</li>
			{/each}
		</ul>

		<h3>
			{i18n.t('cards.weatherConditions.titleDailyHigh', {
				unit: displayUnits.temperature === 'fahrenheit' ? '°F' : '°C'
			})}
		</h3>
		<BarList items={histogram} maxBars={histogram.length} wholeRowLinks />
		<p class="hint">
			{i18n.t('cards.weatherConditions.hintDaysPerBin')}
		</p>
	{:else}
		<a href="/weather#conditions">
			{i18n.t('cards.weatherConditions.linkExploreWeatherConditions')}
		</a>
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
	h3 {
		margin: 1rem 0 0.5rem;
		font-size: 0.9rem;
	}
	.lead {
		margin: 0 0 0.9rem;
		color: var(--ink-muted);
		font-size: 0.92rem;
	}
	.extremes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.extreme {
		padding: 0.75rem 0.9rem;
		border-radius: 0.75rem;
		background: var(--surface-2);
		display: grid;
		gap: 0.1rem;
		min-width: 0;
	}
	.k {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--ink-muted);
	}
	.extreme strong {
		font-size: 1.5rem;
		font-variant-numeric: tabular-nums;
	}
	.meta {
		font-size: 0.82rem;
		color: var(--ink-muted);
		overflow-wrap: anywhere;
	}
	.meta :global(a) {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.meta :global(a:hover) {
		color: var(--accent);
	}
	.fair {
		margin-top: 0.75rem;
		padding: 0.75rem 0.9rem;
		border-radius: 0.75rem;
		background: var(--surface-2);
		display: grid;
		gap: 0.1rem;
	}
	.fair strong {
		font-size: 1.5rem;
		font-variant-numeric: tabular-nums;
	}
	.fair :global(a) {
		color: var(--accent);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.shares {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.55rem;
	}
	.shares a {
		color: inherit;
		text-decoration: none;
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.2rem 0.75rem;
		font-size: 0.88rem;
	}
	.shares a:hover .label {
		text-decoration: underline;
	}
	.shares a:focus-visible {
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
	}
	.track {
		grid-column: 1 / -1;
		height: 0.4rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
		overflow: hidden;
	}
	.fill {
		height: 100%;
	}
	.hint {
		margin: 0.6rem 0 0;
		font-size: 0.78rem;
		color: var(--ink-muted);
	}
	@media (max-width: 520px) {
		.extremes {
			grid-template-columns: 1fr;
		}
	}
</style>
