<script lang="ts">
	import { useI18n } from '#lib/i18n';
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
		REPEAT_PERSONA_LABEL_KEYS,
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
	const i18n = useI18n();

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

	const STYLE_LABEL_KEYS: Record<RepeatStyleKey, string> = {
		all: 'cards.routeRepeats.styleAll',
		sport: 'styles.sport',
		trad: 'styles.trad',
		boulder: 'styles.boulder'
	};

	const STYLE_CHIPS: Record<RepeatStyleKey, string> = {
		all: 'var(--accent)',
		sport: STYLE_COLORS.Sport,
		trad: STYLE_COLORS.Trad,
		boulder: STYLE_COLORS.Boulder
	};

	const PERSONA_TEXT_KEYS: Record<RepeatPersona, string> = {
		explorer: 'cards.routeRepeats.personaExplorer',
		repeater: 'cards.routeRepeats.personaRepeater',
		mixed: 'cards.routeRepeats.personaMixed'
	};

	const slice = $derived((range === 'last12' ? data.last12Months : data.allTime)[style]);
	const styleLabel = $derived(style === 'all' ? '' : i18n.t(STYLE_LABEL_KEYS[style]));
	const styleWord = $derived(styleLabel.toLocaleLowerCase(i18n.locale));
	const rangeWord = $derived(
		range === 'last12'
			? i18n.t('cards.routeRepeats.rangeLast12Months')
			: i18n.t('cards.routeRepeats.rangeYet')
	);
	const fmt = (n: number) => formatNumber(n, dateDisplay);
	const onRoutes = (ascents: number, routes: number) =>
		i18n.t('cards.routeRepeats.onRoutes', { ascents, routes });
	const daysAndAscents = (days: number, ascents: number) =>
		i18n.t('cards.routeRepeats.countDaysAscents', { days, ascents });
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
			<h2>{i18n.t('cards.routeRepeats.titleRepeatsVsNewRoutes')}</h2>
			<HelpLink href="/docs/repeats" label={i18n.t('cards.routeRepeats.helpRepeatsVsNewRoutes')} />
		</div>
		<div class="controls">
			<div class="toggles" role="group" aria-label={i18n.t('cards.routeRepeats.ariaRepeatsRange')}>
				<button
					type="button"
					class={{ active: range === 'all' }}
					aria-pressed={range === 'all'}
					onclick={() => setRange('all')}>{i18n.t('cards.routeRepeats.buttonAllTime')}</button
				>
				<button
					type="button"
					class={{ active: range === 'last12' }}
					aria-pressed={range === 'last12'}
					onclick={() => setRange('last12')}
					>{i18n.t('cards.routeRepeats.buttonLast12Months')}</button
				>
			</div>
			<div
				class="toggles"
				role="group"
				aria-label={i18n.t('cards.routeRepeats.ariaRepeatsClimbingStyle')}
			>
				{#each REPEAT_STYLE_KEYS as key (key)}
					<button
						type="button"
						class={{ active: style === key }}
						aria-pressed={style === key}
						style:--chip={STYLE_CHIPS[key]}
						onclick={() => setStyle(key)}>{i18n.t(STYLE_LABEL_KEYS[key])}</button
					>
				{/each}
			</div>
		</div>
	</header>

	{#if slice.ascents === 0}
		<p class="empty">
			{style === 'all'
				? i18n.t('cards.routeRepeats.emptyAscents', { range: rangeWord })
				: i18n.t('cards.routeRepeats.emptyAscentsStyle', {
						style: styleWord,
						range: rangeWord
					})}
		</p>
	{:else}
		{#if slice.persona}
			<p class="lead">
				<strong class="persona">{i18n.t(REPEAT_PERSONA_LABEL_KEYS[slice.persona])}</strong>
				{i18n.t(PERSONA_TEXT_KEYS[slice.persona])}
			</p>
		{:else}
			<p class="lead">
				{i18n.t('cards.routeRepeats.leadNeedsLabel', {
					threshold: fmt(REPEAT_LABEL_MIN_ASCENTS),
					ascents: fmt(slice.ascents)
				})}
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
				<dt><i class="dot new"></i>{i18n.t('cards.routeRepeats.labelNewRoutes')}</dt>
				<dd>
					<strong>{fmt(slice.newPct ?? 0)}%</strong>
					<span>{onRoutes(slice.newAscents, slice.newRoutes)}</span>
				</dd>
			</div>
			<div>
				<dt><i class="dot repeat"></i>{i18n.t('cards.routeRepeats.labelRepeats')}</dt>
				<dd>
					<strong>{fmt(slice.repeatPct ?? 0)}%</strong>
					<span>{onRoutes(slice.repeatAscents, slice.repeatedRoutes)}</span>
				</dd>
			</div>
		</dl>

		{#if slice.top.length > 0}
			<h3>{i18n.t('cards.routeRepeats.titleMostRepeated')}</h3>
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
						<span class="count">{daysAndAscents(route.days, route.ascents)}</span>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="hint">
				{style === 'all'
					? i18n.t('cards.routeRepeats.emptyRepeats', { range: rangeWord })
					: i18n.t('cards.routeRepeats.emptyRepeatsStyle', {
							style: styleWord,
							range: rangeWord
						})}
			</p>
		{/if}

		<p class="hint">
			{i18n.t('cards.routeRepeats.hintFirstVisit')}
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
