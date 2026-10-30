<script lang="ts">
	import {
		DEFAULT_DATE_DISPLAY,
		formatCalendarDate,
		formatNumber,
		type DateDisplay
	} from '#lib/dates';
	import type { WeatherConditionsView, WeatherExtreme } from '#lib/weatherStats';
	import BarList from './BarList.svelte';

	type Props = { data: WeatherConditionsView; dateDisplay?: DateDisplay };
	let { data, dateDisplay = DEFAULT_DATE_DISPLAY }: Props = $props();

	const SHARE_COLORS: Record<string, string> = {
		rain: 'var(--style-sport)',
		snow: 'var(--ink-muted)',
		freeze: 'var(--style-boulder)',
		heat: 'var(--accent)'
	};

	const FAIR_LABELS = {
		'fair-leaning': 'Fair-weather leaning',
		'all-weather': 'All-weather climber',
		mixed: 'A bit of both'
	} as const;

	const histogram = $derived(
		data.histogram.map((b) => ({
			id: b.id,
			label: b.label,
			value: b.days,
			color: 'var(--accent-2)'
		}))
	);
</script>

{#snippet extreme(title: string, e: WeatherExtreme | null)}
	<div class="extreme">
		<span class="k">{title}</span>
		{#if e}
			<strong>{Math.round(e.tempC)}°C</strong>
			<span class="meta">
				{#if e.href}
					<a href={e.href} target="_blank" rel="noreferrer">{e.routeName ?? 'Ascent'}</a>
				{:else}
					{e.routeName ?? 'Ascent'}
				{/if}
				· {formatCalendarDate(e.date, dateDisplay)}
			</span>
		{:else}
			<strong>—</strong>
			<span class="meta">No data</span>
		{/if}
	</div>
{/snippet}

<article class="panel">
	<header>
		<h2>Weather conditions</h2>
		<a class="how" href="/docs/weather">How it works</a>
	</header>

	<p class="lead">
		Weather is cached for {formatNumber(data.withWeather, dateDisplay)} of
		{formatNumber(data.outdoorDays, dateDisplay)} outdoor climbing days{#if data.withoutWeather > 0}
			({formatNumber(data.withoutWeather, dateDisplay)} not cached yet){/if}.
	</p>

	<div class="extremes">
		{@render extreme('Hottest climb', data.hottest)}
		{@render extreme('Coldest climb', data.coldest)}
	</div>

	{#if data.fairWeather}
		{@const f = data.fairWeather}
		<div class="fair">
			<span class="k">Fair-weather rate</span>
			<strong>{f.fairPct}%</strong>
			<span class="meta">
				{FAIR_LABELS[f.label]}: {formatNumber(f.fairDays, dateDisplay)} of {formatNumber(
					f.days,
					dateDisplay
				)}
				days were fair (15–25°C and dry); {f.toughPct}% were hot, freezing, wet or windy.
				<a href="/logbook?weather=fair">Fair days in the logbook</a>
			</span>
		</div>
	{/if}

	<h3>Share of days</h3>
	<ul class="shares">
		{#each data.shares as share (share.key)}
			<li>
				<span class="label">{share.label}</span>
				<span class="value">
					{share.pct}% · {formatNumber(share.days, dateDisplay)}
					{share.days === 1 ? 'day' : 'days'}
				</span>
				<div class="track" aria-hidden="true">
					<div
						class="fill"
						style:width="{share.pct}%"
						style:background={SHARE_COLORS[share.key]}
					></div>
				</div>
			</li>
		{/each}
	</ul>

	<h3>Daily high (°C)</h3>
	<BarList items={histogram} maxBars={histogram.length} />
	<p class="hint">
		Days per bin · open-meteo.com daily maximum at your crag's cached location (not official climate
		normals).
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
	h3 {
		margin: 1rem 0 0.5rem;
		font-size: 0.9rem;
	}
	.how {
		font-size: 0.85rem;
		color: var(--ink-muted);
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
	.meta a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.meta a:hover {
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
	.fair a {
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
	.shares li {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.2rem 0.75rem;
		font-size: 0.88rem;
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
