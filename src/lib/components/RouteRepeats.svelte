<script lang="ts">
	import { onMount } from 'svelte';
	import HelpLink from '#lib/components/HelpLink.svelte';
	import {
		EMPTY_CARD_PREFERENCES,
		migrateCardPreference,
		saveCardPreference,
		type CardPreferences
	} from '#lib/cardPreferences';
	import { DEFAULT_DATE_DISPLAY, formatNumber, type DateDisplay } from '#lib/dates';
	import {
		REPEAT_LABEL_MIN_ASCENTS,
		REPEAT_PERSONA_LABELS,
		REPEAT_STYLE_KEYS,
		type RepeatPersona,
		type RepeatRange,
		type RepeatStyleKey,
		type RouteRepeatsView
	} from '#lib/routeRepeats';
	import { STYLE_COLORS } from '#lib/ticks';

	type Props = {
		preferences?: CardPreferences;
		data: RouteRepeatsView;
		dateDisplay?: DateDisplay;
	};

	let {
		preferences = EMPTY_CARD_PREFERENCES,
		data,
		dateDisplay = DEFAULT_DATE_DISPLAY
	}: Props = $props();

	let range = $derived<RepeatRange>(preferences.cs_repeats_range ?? 'all');
	let style = $derived<RepeatStyleKey>(preferences.cs_repeats_style ?? 'all');

	let ready = $state(false);
	onMount(() => {
		range = migrateCardPreference('cs_repeats_range', preferences.cs_repeats_range);
		style = migrateCardPreference('cs_repeats_style', preferences.cs_repeats_style);
		ready = true;
	});

	function setRange(next: RepeatRange) {
		range = next;
		saveCardPreference('cs_repeats_range', next);
	}

	function setStyle(next: RepeatStyleKey) {
		style = next;
		saveCardPreference('cs_repeats_style', next);
	}

	const STYLE_LABELS: Record<RepeatStyleKey, string> = {
		all: 'All',
		sport: 'Sport',
		trad: 'Trad',
		boulder: 'Boulder'
	};

	const STYLE_CHIPS: Record<RepeatStyleKey, string> = {
		all: 'var(--accent)',
		sport: STYLE_COLORS.Sport,
		trad: STYLE_COLORS.Trad,
		boulder: STYLE_COLORS.Boulder
	};

	const PERSONA_TEXT: Record<RepeatPersona, string> = {
		explorer: 'Most of your climbs are on routes you hadn’t logged before.',
		repeater: 'At least half of your climbs are return visits to routes you’ve logged before.',
		mixed: 'You split your climbing between new routes and old favourites.'
	};

	const slice = $derived((range === 'last12' ? data.last12Months : data.allTime)[style]);
	const styleWord = $derived(style === 'all' ? '' : `${STYLE_LABELS[style].toLowerCase()} `);
	const rangeWord = $derived(range === 'last12' ? 'in the last 12 months' : 'yet');
	const fmt = (n: number) => formatNumber(n, dateDisplay);
	const plural = (n: number, one: string, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`;
</script>

<article
	class={[
		'panel',
		'route-repeats',
		{
			'card-preference-pending':
				!ready && !(preferences.cs_repeats_range != null && preferences.cs_repeats_style != null)
		}
	]}
>
	<header>
		<div class="titles">
			<h2>Repeats vs new routes</h2>
			<HelpLink href="/docs/repeats" label="How repeats vs new routes works" />
		</div>
		<div class="controls">
			<div class="toggles" role="group" aria-label="Repeats range">
				<button
					type="button"
					class={{ active: range === 'all' }}
					aria-pressed={range === 'all'}
					onclick={() => setRange('all')}>All time</button
				>
				<button
					type="button"
					class={{ active: range === 'last12' }}
					aria-pressed={range === 'last12'}
					onclick={() => setRange('last12')}>Last 12 months</button
				>
			</div>
			<div class="toggles" role="group" aria-label="Repeats climbing style">
				{#each REPEAT_STYLE_KEYS as key (key)}
					<button
						type="button"
						class={{ active: style === key }}
						aria-pressed={style === key}
						style:--chip={STYLE_CHIPS[key]}
						onclick={() => setStyle(key)}>{STYLE_LABELS[key]}</button
					>
				{/each}
			</div>
		</div>
	</header>

	{#if slice.ascents === 0}
		<p class="empty">No dated {styleWord}ascents {rangeWord}.</p>
	{:else}
		{#if slice.persona}
			<p class="lead">
				<strong class="persona">{REPEAT_PERSONA_LABELS[slice.persona]}</strong>
				{PERSONA_TEXT[slice.persona]}
			</p>
		{:else}
			<p class="lead">
				A label appears once this view has {fmt(REPEAT_LABEL_MIN_ASCENTS)} ascents. So far: {fmt(
					slice.ascents
				)}.
			</p>
		{/if}

		<div class="split" aria-hidden="true">
			{#if slice.newAscents > 0}
				<span class="seg new" style:flex-grow={slice.newAscents}></span>
			{/if}
			{#if slice.repeatAscents > 0}
				<span class="seg repeat" style:flex-grow={slice.repeatAscents}></span>
			{/if}
		</div>
		<dl class="legend">
			<div>
				<dt><i class="dot new"></i>New routes</dt>
				<dd>
					<strong>{fmt(slice.newPct ?? 0)}%</strong>
					<span>{plural(slice.newAscents, 'ascent')} on {plural(slice.newRoutes, 'route')}</span>
				</dd>
			</div>
			<div>
				<dt><i class="dot repeat"></i>Repeats</dt>
				<dd>
					<strong>{fmt(slice.repeatPct ?? 0)}%</strong>
					<span
						>{plural(slice.repeatAscents, 'ascent')} on {plural(
							slice.repeatedRoutes,
							'route'
						)}</span
					>
				</dd>
			</div>
		</dl>

		{#if slice.top.length > 0}
			<h3>Most repeated</h3>
			<ol class="top">
				{#each slice.top as route (route.key)}
					<li>
						<div class="name">
							{#if route.routeId != null}
								<a href="/logbook?route={route.routeId}">{route.routeName}</a>
							{:else}
								<span>{route.routeName}</span>
							{/if}
							{#if route.cragName}<span class="crag">{route.cragName}</span>{/if}
						</div>
						<span class="count"
							>{plural(route.days, 'day')} · {plural(route.ascents, 'ascent')}</span
						>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="hint">No repeated {styleWord}routes {rangeWord}.</p>
		{/if}

		<p class="hint">
			A first visit is any ascent on the first day you logged a route; later days on the same route
			are repeats.
		</p>
	{/if}
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.65rem 1rem;
		margin-bottom: 0.75rem;
	}
	.titles {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	h3 {
		margin: 1rem 0 0.4rem;
		font-size: 0.9rem;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem 0.75rem;
	}
	.toggles {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.toggles button {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.65rem;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		background: var(--paper);
		color: var(--ink-muted);
		cursor: pointer;
	}
	.toggles button.active {
		background: var(--chip, var(--accent));
		border-color: var(--chip, var(--accent));
		color: var(--on-accent);
	}
	.lead {
		margin: 0 0 0.75rem;
		font-size: 0.92rem;
		color: var(--ink-muted);
	}
	.persona {
		color: var(--ink);
		font-weight: 700;
		margin-right: 0.25rem;
	}
	.split {
		display: flex;
		height: 0.75rem;
		border-radius: 999px;
		overflow: hidden;
		background: var(--surface-2);
		gap: 2px;
	}
	.seg {
		flex-basis: 0;
		min-width: 4px;
	}
	.new {
		background: var(--accent-2);
	}
	.repeat {
		background: var(--accent);
	}
	.legend {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem 1rem;
		margin: 0.6rem 0 0;
	}
	.legend dt {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--ink-muted);
	}
	.legend dd {
		margin: 0.1rem 0 0;
		display: flex;
		flex-direction: column;
		font-variant-numeric: tabular-nums;
	}
	.legend dd strong {
		font-size: 1.35rem;
		color: var(--ink);
	}
	.legend dd span {
		font-size: 0.8rem;
		color: var(--ink-muted);
	}
	.dot {
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 999px;
		display: inline-block;
	}
	.top {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.4rem;
	}
	.top li {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.75rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--line);
	}
	.top li:last-child {
		border-bottom: none;
	}
	.name {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.name a,
	.name > span:first-child {
		font-weight: 600;
		color: var(--ink);
		overflow-wrap: anywhere;
	}
	.name a:hover {
		color: var(--accent);
	}
	.crag {
		font-size: 0.78rem;
		color: var(--ink-muted);
	}
	.count {
		flex: 0 0 auto;
		font-size: 0.82rem;
		color: var(--ink-muted);
		font-variant-numeric: tabular-nums;
	}
	.hint,
	.empty {
		margin: 0.75rem 0 0;
		font-size: 0.82rem;
		color: var(--ink-muted);
	}
	.empty {
		margin-top: 0;
	}
</style>
