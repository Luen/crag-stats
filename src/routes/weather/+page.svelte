<script lang="ts">
	import WeatherConditions from '#lib/components/WeatherConditions.svelte';
	import WeatherPerformance from '#lib/components/WeatherPerformance.svelte';
	import { formatNumber } from '#lib/dates';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const fmt = (n: number) => formatNumber(n, data.dateDisplay);
</script>

<svelte:head>
	<title>Weather · Crag Stats</title>
	<meta
		name="description"
		content="Historical weather on your outdoor climbing days and patterns in your logged sends and attempts."
	/>
</svelte:head>

<section class="panel head">
	<h1>Weather</h1>
	<p>
		Historical weather on the days you climbed outdoors. These are modelled daily conditions at
		cached locations, not measurements at the wall or a forecast. <a href="/docs/weather"
			>How it works</a
		>
	</p>
	<nav aria-label="Weather sections">
		<a href="#conditions">Conditions</a><a href="#performance">Performance</a><a href="#coverage"
			>Coverage &amp; location quality</a
		>
	</nav>
</section>

{#if data.conditions}
	<section id="conditions" aria-label="Weather conditions">
		<WeatherConditions data={data.conditions} dateDisplay={data.dateDisplay} compact={false} />
	</section>
{:else}
	<section id="conditions" class="panel empty">
		<h2>No weather cached for outdoor climbs yet</h2>
		<p>
			Weather appears after the owner enables weather import and eligible outdoor location-days have
			been fetched. Indoor climbs are excluded. <a href="/docs/weather">Read about weather import</a
			>.
		</p>
	</section>
{/if}

<section id="performance" aria-label="Weather and performance">
	{#if data.performance}
		<WeatherPerformance data={data.performance} dateDisplay={data.dateDisplay} compact={false} />
	{:else}
		<div class="panel empty">
			<h2>Weather &amp; performance</h2>
			<p>There are no outdoor sends or attempts with cached weather to compare yet.</p>
		</div>
	{/if}
</section>

<section id="coverage" class="panel coverage">
	<h2>Coverage &amp; location quality</h2>
	<p>
		A location-day is one calendar day at one weather location, rounded to 0.1°. Visiting two
		locations in a day can count twice. Conditions include all outdoor ticks; performance includes
		only sends and attempts, so their totals can differ. Logbook links list ascents rather than
		location-days.
	</p>
	<dl>
		<div>
			<dt>Outdoor location-days with a resolved location</dt>
			<dd>{fmt(data.coverage.resolvedDays)}</dd>
		</div>
		<div>
			<dt>With usable cached weather</dt>
			<dd>{fmt(data.coverage.cachedDays)}</dd>
		</div>
		<div>
			<dt>Checked, weather unavailable</dt>
			<dd>{fmt(data.coverage.unavailableDays)}</dd>
		</div>
		<div>
			<dt>Not checked yet (including today or future dates)</dt>
			<dd>{fmt(data.coverage.uncheckedDays)}</dd>
		</div>
		<div>
			<dt>Outdoor ascents with a valid day but no resolved location</dt>
			<dd>{fmt(data.coverage.unresolvedAscents)}</dd>
		</div>
	</dl>
	<p>
		Unresolved ascents are excluded from the location-day totals. Unavailable days have already been
		checked and are not automatically queued again. Viewing this page never starts an import.
	</p>
	<p>
		Weather may use route, crag or sector points, an approximate area polygon, or an owner-selected
		nearby place. Terrain, elevation and distance can change conditions at the cliff. Nearby-place
		and polygon weather is included in these views but does not unlock weather badges. The logbook
		shows each ascent's location source.
	</p>
	{#if data.authed}<p>
			<a href="/settings/weather-locations">Review weather locations</a> ·
			<a href="/settings">Manage weather imports</a>
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
	a {
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
