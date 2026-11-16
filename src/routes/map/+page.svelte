<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import CragSectors from '#lib/components/CragSectors.svelte';
	import WorldClimbingMap from '#lib/components/WorldClimbingMap.svelte';
	import { formatCalendarDate, formatNumber } from '#lib/dates';
	import { LOGBOOK_STYLES, includeSelectedOptions } from '#lib/logbookFilters';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const i18n = useI18n();

	/** Map style names render through the shared style labels, falling back to the raw value. */
	const STYLE_KEYS: Record<string, string> = {
		Sport: 'styles.sport',
		Trad: 'styles.trad',
		Boulder: 'styles.boulder',
		'Top rope': 'styles.toprope',
		'Deep water solo': 'styles.deepWaterSolo',
		Aid: 'styles.aid',
		Alpine: 'styles.alpine',
		Solo: 'styles.solo',
		Unknown: 'styles.unknown',
		Other: 'styles.other'
	};
	const styleLabel = (style: string) => (STYLE_KEYS[style] ? i18n.t(STYLE_KEYS[style]) : style);
</script>

<svelte:head
	><title>{i18n.t('pages.map.pageTitle')}</title><meta
		name="description"
		content={i18n.t('pages.map.pageDescription')}
	/></svelte:head
>
<section class="panel">
	<h1>{i18n.t('pages.map.titleClimbingAroundTheWorld')}</h1>
	<p>
		{i18n.t('pages.map.lead', {
			mapped: formatNumber(data.mapped, data.dateDisplay),
			total: formatNumber(data.total, data.dateDisplay),
			places: formatNumber(data.places.length, data.dateDisplay),
			missing: formatNumber(data.missing, data.dateDisplay)
		})}
		<a class="how" href="/docs/climbing-map">{i18n.t('common.howItWorks')}</a>
	</p>
	<form method="GET" class="filters">
		<label
			>{i18n.t('common.from')} <input type="date" name="from" value={data.filters.from} /></label
		><label
			>{i18n.t('pages.map.labelTo')} <input type="date" name="to" value={data.filters.to} /></label
		>
		<label
			>{i18n.t('pages.map.labelStyle')}
			<select name="style" value={data.filters.style}
				><option value="">{i18n.t('pages.map.optionAllStyles')}</option
				>{#each includeSelectedOptions( LOGBOOK_STYLES, [data.filters.style] ) as style (style)}<option
						value={style}>{styleLabel(style)}</option
					>{/each}</select
			></label
		>
		<label
			>{i18n.t('pages.map.labelVenues')}
			<select name="venue" value={data.filters.venue}
				><option value="all">{i18n.t('pages.map.optionAllVenues')}</option><option value="outdoor"
					>{i18n.t('pages.map.optionOutdoor')}</option
				><option value="indoor">{i18n.t('pages.map.optionIndoor')}</option></select
			></label
		>
		<button type="submit">{i18n.t('pages.map.buttonApplyFilters')}</button><a href="/map"
			>{i18n.t('pages.map.linkReset')}</a
		>
	</form>
	{#if data.places.length}<WorldClimbingMap
			places={data.places}
			dateDisplay={data.dateDisplay}
		/>{:else}<p>
			{i18n.t('pages.map.emptyNoPlaces')}
		</p>{/if}
</section>
<div id="sectors" class="values">
	<CragSectors crags={data.crags} dateDisplay={data.dateDisplay} displayUnits={data.displayUnits} />
</div>
<section class="panel values">
	<h2>{i18n.t('pages.map.titleAllMappedPlaces')}</h2>
	<p>{i18n.t('pages.map.leadValues')}</p>
	<div class="table-wrap">
		<table>
			<thead
				><tr
					><th>{i18n.t('pages.map.thPlace')}</th><th>{i18n.t('pages.map.thAscents')}</th><th
						>{i18n.t('pages.map.thRoutes')}</th
					><th>{i18n.t('pages.map.thFirstDay')}</th><th>{i18n.t('pages.map.thLastDay')}</th></tr
				></thead
			><tbody
				>{#each data.places as p (p.key)}<tr
						><td><a href={p.href}>{p.name}{p.country ? ` · ${p.country}` : ''}</a></td><td
							>{formatNumber(p.count, data.dateDisplay)}</td
						><td>{formatNumber(p.routes, data.dateDisplay)}</td><td
							>{p.firstDay ? formatCalendarDate(p.firstDay, data.dateDisplay) : '—'}</td
						><td>{p.lastDay ? formatCalendarDate(p.lastDay, data.dateDisplay) : '—'}</td></tr
					>{/each}</tbody
			>
		</table>
	</div>
</section>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.values {
		margin-top: 1rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	h2 {
		font-size: 1.1rem;
	}
	p {
		color: var(--ink-muted);
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.6rem;
		margin: 1rem 0;
	}
	label {
		display: grid;
		gap: 0.2rem;
		font-size: 0.85rem;
	}
	input,
	select,
	button {
		background: var(--paper);
		color: var(--ink);
		border: 1px solid var(--line);
		padding: 0.4rem 0.5rem;
		border-radius: 0.45rem;
		font: inherit;
	}
	button {
		cursor: pointer;
	}
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		text-align: left;
		padding: 0.55rem;
		border-bottom: 1px solid var(--line);
		font-size: 0.88rem;
	}
	a:not(.how) {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
