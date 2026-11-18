<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import WeatherConditions from '#lib/components/WeatherConditions.svelte';
	import WeatherPerformance from '#lib/components/WeatherPerformance.svelte';
	import RichText from '#lib/components/RichText.svelte';
	import { formatNumber } from '#lib/dates';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const i18n = useI18n();
	const fmt = (n: number) => formatNumber(n, data.dateDisplay);
</script>

<svelte:head>
	<title>{i18n.t('pages.weather.pageTitle')}</title>
	<meta name="description" content={i18n.t('pages.weather.pageDescription')} />
</svelte:head>

<section class="panel head">
	<h1>{i18n.t('pages.weather.titleWeather')}</h1>
	<p>
		{i18n.t('pages.weather.lead')}
		<a class="how" href="/docs/weather">{i18n.t('common.howItWorks')}</a>
	</p>
	<nav aria-label={i18n.t('pages.weather.ariaWeatherSections')}>
		<a href="#conditions">{i18n.t('pages.weather.linkConditions')}</a><a href="#performance"
			>{i18n.t('pages.weather.linkPerformance')}</a
		><a href="#coverage">{i18n.t('pages.weather.titleCoverageAmpLocationQuality')}</a>
	</nav>
</section>

{#if data.conditions}
	<section id="conditions" aria-label={i18n.t('pages.weather.ariaWeatherConditions')}>
		<WeatherConditions
			data={data.conditions}
			dateDisplay={data.dateDisplay}
			displayUnits={data.displayUnits}
			compact={false}
		/>
	</section>
{:else}
	<section id="conditions" class="panel empty">
		<h2>{i18n.t('pages.weather.titleNoWeatherCachedForOutdoor')}</h2>
		<p>
			<RichText
				message={i18n.t('pages.weather.leadNoWeatherCached')}
				tokens={{
					weatherImport: {
						kind: 'link',
						text: i18n.t('pages.weather.linkReadAboutWeatherImport'),
						href: '/docs/weather'
					}
				}}
			/>
		</p>
	</section>
{/if}

<section id="performance" aria-label={i18n.t('pages.weather.ariaWeatherAndPerformance')}>
	{#if data.performance}
		<WeatherPerformance data={data.performance} dateDisplay={data.dateDisplay} compact={false} />
	{:else}
		<div class="panel empty">
			<h2>{i18n.t('pages.weather.titleWeatherAmpPerformance')}</h2>
			<p>{i18n.t('pages.weather.leadNoPerformanceData')}</p>
		</div>
	{/if}
</section>

<section id="coverage" class="panel coverage">
	<h2>{i18n.t('pages.weather.titleCoverageAmpLocationQuality')}</h2>
	<p>
		{i18n.t('pages.weather.leadCoverage')}
	</p>
	<dl>
		<div>
			<dt>{i18n.t('pages.weather.labelResolvedLocationDays')}</dt>
			<dd>{fmt(data.coverage.resolvedDays)}</dd>
		</div>
		<div>
			<dt>{i18n.t('pages.weather.labelUsableCachedWeather')}</dt>
			<dd>{fmt(data.coverage.cachedDays)}</dd>
		</div>
		<div>
			<dt>{i18n.t('pages.weather.labelCheckedWeatherUnavailable')}</dt>
			<dd>{fmt(data.coverage.unavailableDays)}</dd>
		</div>
		<div>
			<dt>{i18n.t('pages.weather.labelNotCheckedYet')}</dt>
			<dd>{fmt(data.coverage.uncheckedDays)}</dd>
		</div>
		<div>
			<dt>{i18n.t('pages.weather.labelOutdoorAscentsWithoutLocation')}</dt>
			<dd>{fmt(data.coverage.unresolvedAscents)}</dd>
		</div>
	</dl>
	<p>
		{i18n.t('pages.weather.hintCoverageTotals')}
	</p>
	<p>
		{i18n.t('pages.weather.hintLocationQuality')}
	</p>
	{#if data.authed}<p>
			<a href="/settings/weather-locations">{i18n.t('pages.weather.linkReviewWeatherLocations')}</a>
			·
			<a href="/settings">{i18n.t('pages.weather.linkManageWeatherImports')}</a>
		</p>{/if}
</section>

<style>
	section {
		margin-bottom: 1rem;
		scroll-margin-top: 5rem;
	}
	.head,
	.empty,
	.coverage {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h1 {
		margin: 0 0 0.5rem;
		font-size: 1.5rem;
	}
	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.05rem;
	}
	p {
		color: var(--ink-muted);
		max-width: 65rem;
	}
	a,
	.empty p :global(a) {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
	}
	dl {
		display: grid;
		gap: 0.5rem;
	}
	dl div {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		max-width: 45rem;
	}
	dd {
		margin: 0;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
</style>
