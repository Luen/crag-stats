<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import LogbookAutocomplete from '#lib/components/LogbookAutocomplete.svelte';
	import LogbookDateRange from '#lib/components/LogbookDateRange.svelte';
	import { SOLO_KINDS } from '#lib/soloKind';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import GradeChip from '#lib/components/GradeChip.svelte';
	import ProjectSelection from '#lib/components/ProjectSelection.svelte';
	import StyleBadge from '#lib/components/StyleBadge.svelte';
	import TagChips from '#lib/components/TagChips.svelte';
	import TickTypeIcon from '#lib/components/TickTypeIcon.svelte';
	import { formatCalendarDate } from '#lib/dates';
	import { formatPrecipitation, formatTemperature, formatTemperatureDetail } from '#lib/units';
	import WeatherChips from '#lib/components/WeatherChips.svelte';
	import {
		includeSelectedOptions,
		LOGBOOK_QUALITIES,
		LOGBOOK_STYLES,
		LOGBOOK_TICKS
	} from '#lib/logbookFilters';
	import { logbookStyleLabels } from '#lib/logbookStyle';
	import RichText from '#lib/components/RichText.svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();
	const t = i18n.t;

	/**
	 * Facet checkbox labels theCrag's canonical values (`?style=Sport`, `?tick=Red point` …). The
	 * value stays the URL parameter; only the visible label follows the catalogue.
	 */
	const TICK_KEYS: Record<string, string> = {
		Onsight: 'ticks.onsight',
		Flash: 'ticks.flash',
		'Red point': 'ticks.redpoint',
		'Pink point': 'ticks.pinkpoint',
		Tick: 'ticks.tick',
		Send: 'ticks.send',
		Clean: 'ticks.clean',
		Attempt: 'ticks.attempt',
		'Hang dog': 'ticks.hangdog',
		Working: 'ticks.working',
		Retreat: 'ticks.retreat',
		Repeat: 'ticks.repeat',
		'Top rope': 'ticks.toprope',
		Lead: 'ticks.lead',
		'Free solo': 'ticks.freesolo',
		Solo: 'ticks.solo',
		'Roped solo': 'ticks.ropedsolo',
		'Lead solo': 'ticks.leadsolo',
		'Aid solo': 'ticks.aidsolo',
		'All free with rest': 'ticks.allfreewithrest',
		Dab: 'ticks.dab',
		Hit: 'ticks.hit',
		Target: 'ticks.target',
		Mark: 'ticks.mark'
	};
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
	const QUALITY_KEYS: Record<string, string> = {
		'Mega Classic': 'pages.logbook.qualityMegaClassic',
		Classic: 'pages.logbook.qualityClassic',
		'Very Good': 'pages.logbook.qualityVeryGood',
		Good: 'pages.logbook.qualityGood',
		Average: 'pages.logbook.qualityAverage',
		"Don't Bother": 'pages.logbook.qualityDontBother',
		Crap: 'pages.logbook.qualityCrap'
	};
	const SOLO_KEYS: Record<string, string> = {
		toprope: 'solo.toprope',
		lead: 'solo.lead',
		free: 'solo.free',
		dws: 'solo.dws',
		aid: 'solo.aid'
	};

	/** Fall back to the provider value so an unmapped name still renders something. */
	const labelFor = (keys: Record<string, string>, value: string) =>
		keys[value] ? t(keys[value]) : value;

	function filterParams() {
		// Query builder for hrefs, rebuilt when called.
		const p = new SvelteURLSearchParams();
		if (data.q) p.set('q', data.q);
		if (data.route) p.set('route', String(data.route));
		if (data.routeName) p.set('routeName', data.routeName);
		if (data.cragKey) p.set('cragKey', data.cragKey);
		if (data.sectorKey) p.set('sectorKey', data.sectorKey);
		if (data.solo) p.set('solo', data.solo);

		if (data.place) p.set('place', data.place);
		if (data.mapVenue) p.set('mapVenue', data.mapVenue);
		for (const s of data.styles) p.append('style', s);
		for (const t of data.ticks) p.append('tick', t);
		for (const q of data.qualities) p.append('quality', q);
		if (data.crag) p.set('crag', data.crag);
		if (data.sector) p.set('sector', data.sector);
		if (data.sectorPath.length) p.set('sectorPath', JSON.stringify(data.sectorPath));
		if (data.day) p.set('day', data.day);
		if (data.from) p.set('from', data.from);
		if (data.to) p.set('to', data.to);
		if (data.season) p.set('season', data.season);
		if (data.multipitch) p.set('multipitch', '1');
		if (data.fa) p.set('fa', data.fa);
		if (data.history) p.set('history', data.history);
		if (data.project) p.set('project', data.project);
		if (data.setter) p.set('setter', data.setter);
		if (data.with) p.set('with', data.with);
		if (data.partners) p.set('partners', data.partners);
		for (const m of data.missing) p.append('missing', m);
		if (data.weather) p.set('weather', data.weather);
		if (data.weatherHighMin !== '') p.set('weatherHighMin', String(data.weatherHighMin));
		if (data.weatherHighMax !== '') p.set('weatherHighMax', String(data.weatherHighMax));
		if (data.tag) p.set('tag', data.tag);
		for (const t of data.tagExact) p.append('tagExact', t);
		if (data.partnerMatch === 'exact') p.set('partnerMatch', 'exact');
		if (data.rock) p.set('rock', data.rock);
		if (data.minStars !== '') p.set('minStars', String(data.minStars));
		if (data.minScore !== '') p.set('minScore', String(data.minScore));
		if (data.maxScore !== '') p.set('maxScore', String(data.maxScore));
		if (data.score !== '') p.set('score', String(data.score));
		if (data.gradeScale) p.set('gradeScale', data.gradeScale);
		if (data.tcMin !== '' && data.tcMax !== '') {
			p.set('tcMin', String(data.tcMin));
			p.set('tcMax', String(data.tcMax));
		}
		if (data.band !== '') p.set('band', String(data.band));
		if (data.sort && data.sort !== 'date') p.set('sort', data.sort);
		if (data.order && data.order !== 'desc') p.set('order', data.order);
		return p;
	}

	function clearWeatherRangeHref() {
		const p = filterParams();
		p.delete('weatherHighMin');
		p.delete('weatherHighMax');
		const query = p.toString();
		return query ? `?${query}` : '/logbook';
	}

	function pageHref(page: number) {
		const p = filterParams();
		p.set('page', String(page));
		return `?${p.toString()}`;
	}

	function sortHref(col: string) {
		const p = filterParams();
		p.set('sort', col);
		const nextOrder = data.sort === col && data.order === 'desc' ? 'asc' : 'desc';
		p.set('order', nextOrder);
		return `?${p.toString()}`;
	}

	function sortMark(col: string) {
		if (data.sort !== col) return '';
		return data.order === 'asc' ? ' ↑' : ' ↓';
	}

	const WEATHER_LABELS: Record<string, string> = {
		heat: 'pages.logbook.weatherHeat',
		freeze: 'pages.logbook.weatherFreeze',
		rain: 'pages.logbook.weatherRain',
		snow: 'pages.logbook.weatherSnow',
		fair: 'pages.logbook.weatherFair',
		perfect: 'pages.logbook.weatherPerfect',
		wind: 'pages.logbook.weatherWind',
		calm: 'pages.logbook.weatherCalm'
	};

	function checked(list: string[], value: string) {
		return list.includes(value);
	}
</script>

<section class="panel head">
	<h1>{i18n.t('pages.logbook.titleLogbook')}</h1>
	{#if form?.message}<p role="alert">{form.message}</p>{/if}
	{#if data.place}<p>
			{t('pages.logbook.placeFilter')} · <a href="/map">{t('pages.logbook.backToMap')}</a> ·
			<a href="/logbook">{t('pages.logbook.clearPlace')}</a>
		</p>{/if}
	<p>
		{t('pages.logbook.ascentCount', { count: data.total })}
		{#if data.route}
			· {t('pages.logbook.selectedClimb')} ·
			<a href="/logbook">{t('pages.logbook.clearClimb')}</a>{/if}
		{#if data.score !== ''}
			· {t('pages.logbook.gradeScore', { score: data.score })}
		{/if}
		{#if data.tcMin !== '' && data.tcMax !== ''}
			· {t('pages.logbook.onePyramidGradeRow')}
		{/if}
		{#if data.day}
			· {formatCalendarDate(data.day, data.dateDisplay)}
		{/if}
		{#if data.sector}
			· {t('pages.logbook.sectorValue', { sector: data.sector })}
		{/if}
		{#if data.sectorPath.length}
			· {t('pages.logbook.sectorValue', { sector: data.sectorPath.join(' → ') })} ·
			<a href="/logbook">{t('pages.logbook.clearSector')}</a>{/if}
		{#if data.fa}
			· FA {data.fa}
		{/if}
		{#if data.history === 'pending'}
			· {t('pages.logbook.historyPending')}
		{/if}
		{#if data.project}
			· {data.project === 'yes' ? t('pages.logbook.projectsOnly') : t('pages.logbook.notProjects')}
		{/if}
		{#if data.setter}
			· {data.setter === 'me'
				? t('pages.logbook.routesISet')
				: t('pages.logbook.noSetterCreditFound')}
		{/if}
		{#if data.weather}
			· {t('pages.logbook.weatherDays', { label: labelFor(WEATHER_LABELS, data.weather) })}
		{/if}
		{#if data.weatherHighMin !== ''}
			· {t('pages.logbook.dailyHighAtLeast', {
				value: formatTemperature(Number(data.weatherHighMin), data.displayUnits.temperature)
			})}{/if}
		{#if data.weatherHighMax !== ''}
			· {t('pages.logbook.dailyHighBelow', {
				value: formatTemperature(Number(data.weatherHighMax), data.displayUnits.temperature)
			})}{/if}
		{#if data.weatherHighMin !== '' || data.weatherHighMax !== ''}<a href={clearWeatherRangeHref()}>
				{t('pages.logbook.clearWeatherRange')}
			</a>{/if}
		{#if data.rock}
			· {t('pages.logbook.rockValue', { rock: data.rock })}
		{/if}
		{#if data.tagExact.length}
			· {t('pages.logbook.tagValue', { tags: data.tagExact.join(', ') })}
		{/if}
	</p>
</section>

<form class="panel filters" method="GET">
	{#if data.place}<input type="hidden" name="place" value={data.place} />{/if}
	{#if data.mapVenue}<input type="hidden" name="mapVenue" value={data.mapVenue} />{/if}

	{#if data.weatherHighMin !== ''}<input
			type="hidden"
			name="weatherHighMin"
			value={data.weatherHighMin}
		/>{/if}
	{#if data.weatherHighMax !== ''}<input
			type="hidden"
			name="weatherHighMax"
			value={data.weatherHighMax}
		/>{/if}
	<div class="filter-row names-row">
		<label class="filter-field search-field">
			{t('pages.logbook.labelSearch')}
			<input
				name="q"
				value={data.q}
				placeholder={data.notesShown
					? t('pages.logbook.placeholderSearchNotes')
					: t('pages.logbook.placeholderSearch')}
			/>
		</label>
		{#key data}
			<LogbookAutocomplete
				name="routeName"
				label={t('pages.logbook.labelRoute')}
				value={data.options.routes.find((r) => r.key === String(data.route))?.value ??
					data.routeName}
				keyName="route"
				keyValue={String(data.route)}
				options={data.options.routes}
			/>
			<LogbookAutocomplete
				name="crag"
				label={t('pages.logbook.labelCrag')}
				value={data.crag}
				keyName="cragKey"
				keyValue={data.cragKey}
				options={data.options.crags}
			/>
		{/key}
		{#if data.sectorPath.length}<input
				type="hidden"
				name="sectorPath"
				value={JSON.stringify(data.sectorPath)}
			/>{/if}
		{#key data}
			<LogbookAutocomplete
				name="sector"
				label={t('pages.logbook.labelSectorParent')}
				value={data.sector}
				keyName="sectorKey"
				keyValue={data.sectorKey}
				options={data.options.sectors}
			/>
			<LogbookAutocomplete
				name="with"
				label={t('pages.logbook.labelWithPartner')}
				value={data.with}
				options={data.options.partners}
			/>
		{/key}
		<label class="filter-field">
			{t('pages.logbook.labelPartnerMatch')}
			<select
				name="partnerMatch"
				aria-label={i18n.t('pages.logbook.ariaPartnerMatch')}
				value={data.partnerMatch}
			>
				<option value="contains">{i18n.t('pages.logbook.optionPartnerNameContains')}</option>
				<option value="exact">{i18n.t('pages.logbook.optionExactPartnerName')}</option>
			</select>
		</label>
		<label class="rock-filter">
			{t('pages.logbook.labelRockType')}
			<select
				name="rock"
				aria-label={i18n.t('pages.logbook.ariaRockType')}
				value={data.rock}
				aria-describedby={data.options.rocks.length ? undefined : 'rock-help'}
			>
				<option value="">{i18n.t('pages.logbook.optionAnyRockType')}</option>
				{#if data.rock && !data.options.rocks.some((r) => r.value === data.rock)}
					<option value={data.rock}>
						{t('pages.logbook.notInCachedLogbook', { rock: data.rock })}
					</option>
				{/if}
				{#each data.options.rocks as rock (rock.value)}<option value={rock.value}>
						{rock.label}
					</option>{/each}
			</select>
		</label>
	</div>

	{#if !data.options.rocks.length}<p class="filter-help" id="rock-help">
			{t('pages.logbook.noRockTagsCached')}
		</p>{/if}

	<div class="filter-row">
		{#key data}<LogbookDateRange
				from={data.from}
				to={data.to}
				years={data.options.years}
				today={data.today}
				error={data.dateError}
			/>{/key}
	</div>

	<div class="filter-row">
		<select name="solo" aria-label={i18n.t('pages.logbook.ariaSoloType')} value={data.solo}>
			<option value="">{i18n.t('pages.logbook.optionAnySoloType')}</option>
			{#each SOLO_KINDS as kind (kind.kind)}
				<option value={kind.kind}>{labelFor(SOLO_KEYS, kind.kind)}</option>
			{/each}
		</select>
		<select
			name="band"
			aria-label={i18n.t('pages.logbook.ariaGradeBand')}
			value={String(data.band)}
		>
			<option value="">{i18n.t('pages.logbook.optionAnyBand')}</option>
			<option value="1">{i18n.t('pages.logbook.optionBeginner')}</option>
			<option value="2">{i18n.t('pages.logbook.optionIntermediate')}</option>
			<option value="3">{i18n.t('pages.logbook.optionExperienced')}</option>
			<option value="4">{i18n.t('pages.logbook.optionExpert')}</option>
			<option value="5">{i18n.t('pages.logbook.optionElite')}</option>
		</select>
		<select
			name="minScore"
			aria-label={i18n.t('pages.logbook.ariaMinimumRouteGrade')}
			value={String(data.minScore)}
		>
			<option value="">{i18n.t('pages.logbook.optionMinRouteGrade')}</option>
			{#each data.gradeOptions as g (g.score)}
				<option value={g.score}>{g.label}</option>
			{/each}
		</select>
		<select
			name="maxScore"
			aria-label={i18n.t('pages.logbook.ariaMaximumRouteGrade')}
			value={String(data.maxScore)}
		>
			<option value="">{i18n.t('pages.logbook.optionMaxRouteGrade')}</option>
			{#each data.gradeOptions as g (g.score)}
				<option value={g.score}>{g.label}</option>
			{/each}
		</select>
		<select name="fa" aria-label={i18n.t('pages.logbook.ariaFirstAscentMark')} value={data.fa}>
			<option value="">{i18n.t('pages.logbook.optionAnyFaMark')}</option>
			<option value="any">{i18n.t('pages.logbook.optionMyFaOrFfa')}</option>
			<option value="FA">{i18n.t('pages.logbook.optionMyFa')}</option>
			<option value="FFA">{i18n.t('pages.logbook.optionMyFfa')}</option>
			<option value="none">{i18n.t('pages.logbook.optionNoFaFfaMark')}</option>
		</select>
		<select name="setter" aria-label={i18n.t('pages.logbook.ariaRouteSetter')} value={data.setter}>
			<option value="">{i18n.t('pages.logbook.optionAnySetter')}</option>
			<option value="me">{i18n.t('pages.logbook.optionRoutesISet')}</option>
			<option value="none">{i18n.t('pages.logbook.optionNoSetterCreditFound')}</option>
		</select>
		<select
			name="project"
			aria-label={i18n.t('pages.logbook.ariaTheCragProjectFlag')}
			value={data.project}
		>
			<option value="">{i18n.t('pages.logbook.optionAnyProjectFlag')}</option>
			<option value="yes">{i18n.t('pages.logbook.optionProject')}</option>
			<option value="no">{i18n.t('pages.logbook.optionNotAProject')}</option>
		</select>
		{#if data.historyFilter}
			<select
				name="history"
				aria-label={i18n.t('pages.logbook.ariaRouteHistoryImport')}
				value={data.history}
			>
				<option value="">{i18n.t('pages.logbook.optionAnyHistoryStatus')}</option>
				<option value="pending">{i18n.t('pages.logbook.optionHistoryNotCheckedYet')}</option>
			</select>
		{/if}
		{#if data.weatherAvailable || data.weather}
			<select
				name="weather"
				aria-label={i18n.t('pages.logbook.ariaWeatherOnTheDay')}
				value={data.weather}
			>
				<option value="">{i18n.t('pages.logbook.optionAnyWeather')}</option>
				<option value="fair">
					{data.displayUnits.temperature === 'fahrenheit'
						? t('pages.logbook.optionFairDayImperial')
						: t('pages.logbook.optionFairDayMetric')}
				</option>
				<option value="perfect">{i18n.t('pages.logbook.optionPerfectDayFairCalmNot')}</option>
				<option value="heat">
					{data.displayUnits.temperature === 'fahrenheit'
						? t('pages.logbook.optionHotDayImperial')
						: t('pages.logbook.optionHotDayMetric')}
				</option>
				<option value="freeze">
					{data.displayUnits.temperature === 'fahrenheit'
						? t('pages.logbook.optionFreezingImperial')
						: t('pages.logbook.optionFreezingMetric')}
				</option>
				<option value="rain">{i18n.t('pages.logbook.optionRainyDay')}</option>
				<option value="snow">{i18n.t('pages.logbook.optionSnowyDay')}</option>
				<option value="wind">
					{data.displayUnits.wind === 'mph'
						? t('pages.logbook.optionWindyDayImperial')
						: t('pages.logbook.optionWindyDayMetric')}
				</option>
				<option value="calm">
					{data.displayUnits.wind === 'mph'
						? t('pages.logbook.optionStillDayImperial')
						: t('pages.logbook.optionStillDayMetric')}
				</option>
			</select>
		{/if}
		<select name="partners" aria-label={i18n.t('pages.logbook.ariaPartners')} value={data.partners}>
			<option value="">{i18n.t('pages.logbook.optionAnyPartners')}</option>
			<option value="has">{i18n.t('pages.logbook.optionHasPartners')}</option>
			<option value="missing">{i18n.t('pages.logbook.optionMissingPartners')}</option>
		</select>
	</div>

	<fieldset class="facet">
		<legend>{t('pages.logbook.facetStyle')}</legend>
		<div class="checks">
			{#each includeSelectedOptions(LOGBOOK_STYLES, data.styles) as style (style)}
				<label class="check">
					<input type="checkbox" name="style" value={style} checked={checked(data.styles, style)} />
					{labelFor(STYLE_KEYS, style)}
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="facet">
		<legend>{t('pages.logbook.facetTick')}</legend>
		<div class="checks">
			{#each includeSelectedOptions(LOGBOOK_TICKS, data.ticks) as tick (tick)}
				<label class="check">
					<input type="checkbox" name="tick" value={tick} checked={checked(data.ticks, tick)} />
					{labelFor(TICK_KEYS, tick)}
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="facet">
		<legend>{t('pages.logbook.facetQuality')}</legend>
		<div class="checks">
			{#each LOGBOOK_QUALITIES as quality (quality)}
				<label class="check">
					<input
						type="checkbox"
						name="quality"
						value={quality}
						checked={checked(data.qualities, quality)}
					/>
					{labelFor(QUALITY_KEYS, quality)}
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="facet">
		<legend>{t('pages.logbook.facetMinStars')}</legend>
		<div class="checks">
			<label class="check">
				<input type="radio" name="minStars" value="" checked={data.minStars === ''} />
				{t('pages.logbook.optionAny')}
			</label>
			<label class="check">
				<input type="radio" name="minStars" value="1" checked={data.minStars === 1} />
				★+
			</label>
			<label class="check">
				<input type="radio" name="minStars" value="2" checked={data.minStars === 2} />
				★★+
			</label>
			<label class="check">
				<input type="radio" name="minStars" value="3" checked={data.minStars === 3} />
				★★★
			</label>
		</div>
	</fieldset>

	<fieldset class="facet">
		<legend>{t('pages.logbook.facetMissing')}</legend>
		<div class="checks">
			<label class="check">
				<input
					type="checkbox"
					name="missing"
					value="height"
					checked={checked(data.missing, 'height')}
				/>
				{t('pages.logbook.missingHeight')}
			</label>
			<label class="check">
				<input
					type="checkbox"
					name="missing"
					value="bolts"
					checked={checked(data.missing, 'bolts')}
				/>
				{t('pages.logbook.missingBolts')}
			</label>
			<label class="check">
				<input
					type="checkbox"
					name="missing"
					value="pitch"
					checked={checked(data.missing, 'pitch')}
				/>
				{t('pages.logbook.missingPitch')}
			</label>
			{#if data.canFilterMissingWeather}
				<label class="check">
					<input
						type="checkbox"
						name="missing"
						value="weather"
						checked={checked(data.missing, 'weather')}
					/>
					{t('pages.logbook.missingWeather')}
				</label>
			{/if}
		</div>
	</fieldset>

	<div class="filter-row">
		<input
			name="tag"
			value={data.tag}
			placeholder={i18n.t('pages.logbook.placeholderTagContains')}
			aria-label={i18n.t('pages.logbook.ariaRouteTag')}
		/>
		{#each data.tagExact as exact, i (exact)}
			{#if i > 0}
				<input type="hidden" name="tagExact" value={exact} />
			{/if}
		{/each}
		<input
			name="tagExact"
			value={data.tagExact[0] ?? ''}
			placeholder={i18n.t('pages.logbook.placeholderExactTagSteepnessVertical')}
			aria-label={i18n.t('pages.logbook.ariaExactRouteTagCategoryName')}
		/>
	</div>

	<div class="filter-row actions">
		<label class="check">
			<input type="checkbox" name="multipitch" value="1" checked={data.multipitch} />
			{t('pages.logbook.multipitchOnly')}
		</label>
		{#if data.tcMin !== '' && data.tcMax !== ''}
			<input type="hidden" name="tcMin" value={data.tcMin} />
			<input type="hidden" name="tcMax" value={data.tcMax} />
		{/if}
		{#if data.gradeScale}
			<input type="hidden" name="gradeScale" value={data.gradeScale} />
		{/if}
		{#if data.score !== ''}
			<input type="hidden" name="score" value={data.score} />
		{/if}
		{#if data.day}
			<input type="hidden" name="day" value={data.day} />
		{/if}
		<select name="sort" aria-label={i18n.t('pages.logbook.ariaSortBy')} value={data.sort}>
			<option value="date">{i18n.t('pages.logbook.optionSortDate')}</option>
			<option value="grade">{i18n.t('pages.logbook.optionSortGrade')}</option>
			<option value="quality">{i18n.t('pages.logbook.optionSortQuality')}</option>
			<option value="stars">{i18n.t('pages.logbook.optionSortStars')}</option>
			<option value="style">{i18n.t('pages.logbook.optionSortStyle')}</option>
			<option value="tick">{i18n.t('pages.logbook.optionSortTick')}</option>
			<option value="ascents">{i18n.t('pages.logbook.optionSortMyAscentsOnRoute')}</option>
			<option value="popularity">{i18n.t('pages.logbook.optionSortPopularity')}</option>
		</select>
		<select name="order" aria-label={i18n.t('pages.logbook.ariaSortOrder')} value={data.order}>
			<option value="desc">{i18n.t('pages.logbook.optionDescending')}</option>
			<option value="asc">{i18n.t('pages.logbook.optionAscending')}</option>
		</select>
		<button type="submit">{i18n.t('pages.logbook.buttonApplyFilters')}</button>
	</div>
	<p class="hint">
		<RichText message={t('pages.logbook.hint')} />
	</p>
</form>

<!-- Keyboard users need to reach the horizontally scrollable table wrapper above the mobile breakpoint. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<section
	class="panel table-wrap"
	aria-label={i18n.t('pages.logbook.ariaLogbookAscents')}
	tabindex="0"
>
	<table>
		<thead>
			<tr>
				<th>
					<a href={sortHref('date')} class:active={data.sort === 'date'}>
						{t('pages.logbook.thDate')}{sortMark('date')}
					</a>
				</th>
				<th>{t('pages.logbook.thRoute')}</th>
				<th class="weather-cell">{t('pages.logbook.thWeather')}</th>
				<th>
					<a href={sortHref('grade')} class:active={data.sort === 'grade'}>
						{t('pages.logbook.thGrade')}{sortMark('grade')}
					</a>
				</th>
				<th>
					<a href={sortHref('tick')} class:active={data.sort === 'tick'}>
						{t('pages.logbook.thTick')}{sortMark('tick')}
					</a>
				</th>
				<th>
					<a href={sortHref('quality')} class:active={data.sort === 'quality'}>
						{t('pages.logbook.thQuality')}{sortMark('quality')}
					</a>
				</th>
				<th>
					<a href={sortHref('stars')} class:active={data.sort === 'stars'}>★{sortMark('stars')}</a>
				</th>
				<th>
					<a
						href={sortHref('ascents')}
						class:active={data.sort === 'ascents'}
						title={i18n.t('pages.logbook.titleYourAscentsOnThisRoute')}
					>
						×{sortMark('ascents')}
					</a>
				</th>
				<th>
					<a
						href={sortHref('popularity')}
						class:active={data.sort === 'popularity'}
						title={i18n.t('pages.logbook.titleCommunityPopularity')}
					>
						{t('pages.logbook.thPopularity')}{sortMark('popularity')}
					</a>
				</th>
				<th>{t('pages.logbook.thWith')}</th>
				<th>{t('pages.logbook.thCragSector')}</th>
			</tr>
		</thead>
		<tbody>
			{#each data.rows as row (row.id)}
				<tr>
					<td class="date desktop-cell">{formatCalendarDate(row.ascentDate, data.dateDisplay)}</td>
					<td class="route">
						<div class="card-head">
							<div class="route-name">
								{#if row.url}
									<a href={row.url} target="_blank" rel="noreferrer">{row.displayName}</a>
								{:else}
									{row.displayName}
								{/if}
								{#if row.firstAscent}
									<span
										class="chip fa"
										title={row.firstAscent === 'FFA'
											? t('pages.logbook.firstFreeAscentTitle')
											: t('pages.logbook.firstAscentTitle')}
									>
										{row.firstAscent}
									</span>
								{/if}
								{#if row.pitchLabel}
									<span class="chip">{row.pitchLabel}</span>
								{/if}
								{#if row.numberAttempts != null && row.numberAttempts > 1}
									<span class="chip">
										{t('pages.logbook.attempts', { count: row.numberAttempts })}
									</span>
								{/if}
							</div>
							<div class="mobile-grade">
								<GradeChip grade={row.gradeLabel} band={row.gradeBand} />
							</div>
						</div>
						<div class="mobile-sub">
							<span>{formatCalendarDate(row.ascentDate, data.dateDisplay)}</span>
							·&nbsp;<TickTypeIcon tick={row.tickType} />
							{#if row.cragName}
								·&nbsp;<a
									href="/logbook?crag={encodeURIComponent(row.cragName)}"
									title={i18n.t('pages.logbook.titleFilterLogbookToThisCrag')}
								>
									{row.cragName}
								</a>{#if row.cragUrl}<a
										class="ext"
										href={row.cragUrl}
										target="_blank"
										rel="noreferrer"
										aria-label={t('pages.logbook.ariaOpenOnTheCrag', {
											name: row.cragName
										})}
									>
										&nbsp;↗
									</a>{/if}
							{/if}
							{#if row.parentName}
								·&nbsp;<a
									href="/logbook?sector={encodeURIComponent(row.parentName)}"
									title={i18n.t('pages.logbook.titleFilterLogbookToThisSector')}
								>
									{row.parentName}
								</a>
							{/if}
							{#if row.quality}
								·&nbsp;<span>{row.quality}</span>
							{/if}
							{#if row.stars != null}
								·&nbsp;<span>★ {row.stars}</span>
							{/if}
							{#if row.myAscentsOnRoute > 1}
								·&nbsp;<span title={i18n.t('pages.logbook.titleYourAscentsOnThisRoute')}>
									×{row.myAscentsOnRoute}
								</span>
							{/if}
							{#if row.routePopularity != null}
								·&nbsp;<span title={i18n.t('pages.logbook.titleCommunityPopularity')}>
									Pop {Math.round(row.routePopularity)}
								</span>
							{/if}
						</div>
						<div
							class="mobile-styles"
							role="group"
							aria-label={i18n.t('pages.logbook.ariaClimbStyles')}
						>
							{#each logbookStyleLabels(row) as label (label)}
								<StyleBadge style={label} />
							{/each}
						</div>
						{#if row.partners}
							<div class="mobile-partners">
								{t('pages.logbook.partnersOnAscent', { partners: row.partners })}
							</div>
						{/if}
						<TagChips tags={row.tags} />
						<!-- Narrow screens hide the Weather column; keep chips beside the route there. -->
						<span class="route-weather-chips">
							<WeatherChips
								location={row.weatherLocation}
								chips={row.weatherChips}
								dateDisplay={data.dateDisplay}
								displayUnits={data.displayUnits}
							/>
						</span>
						{#if row.comment}
							{#if row.comment.length > 140}
								<details class="note">
									<summary>
										<span class="note-preview">{row.comment.slice(0, 120)}…</span>
										<span class="note-full">{row.comment}</span>
									</summary>
								</details>
							{:else}
								<div class="note">{row.comment}</div>
							{/if}
						{/if}
						{#if data.canMarkFirstAscents}
							<form method="POST" action="?/firstAscent" class="fa-edit" use:enhance>
								<input type="hidden" name="provider" value={row.routeProvider} />
								<input type="hidden" name="route" value={row.routeExternalId} />
								{#if row.firstAscent}
									<button type="submit" name="kind" value="">
										{t('pages.logbook.unmark', { mark: row.firstAscent })}
									</button>
								{:else}
									<button
										type="submit"
										name="kind"
										value="FA"
										aria-label={t('pages.logbook.ariaMarkFa', {
											name: row.displayName
										})}
									>
										{t('pages.logbook.markFa')}
									</button>
									<button
										type="submit"
										name="kind"
										value="FFA"
										aria-label={t('pages.logbook.ariaMarkFfa', {
											name: row.displayName
										})}
									>
										{t('pages.logbook.markFfa')}
									</button>
								{/if}
							</form>
							<ProjectSelection
								action="?/projectSelection"
								provider={row.routeProvider}
								route={row.routeExternalId}
								name={row.displayName}
								decision={data.projectSelections?.[`${row.routeProvider}:${row.routeExternalId}`] ??
									'auto'}
							/>
						{/if}
					</td>
					<td class="weather-cell desktop-cell">
						{#if row.weather}
							<div class="weather-values">
								{#if row.weatherLocation}<span title={row.weatherLocation.precision}>
										{t('pages.logbook.locationPrefix', {
											source:
												row.weatherLocation.source === 'place'
													? t('pages.logbook.weatherSourcePlace')
													: row.weatherLocation.source === 'route'
														? t('pages.logbook.weatherSourceRoute')
														: row.weatherLocation.source === 'polygon'
															? t('pages.logbook.weatherSourcePolygon')
															: row.weatherLocation.source === 'cached'
																? t('pages.logbook.weatherSourceCached')
																: t('pages.logbook.weatherSourceCrag'),
											name: row.weatherLocation.name
										})}
									</span>{/if}
								<span>
									{t('pages.logbook.weatherHigh', {
										value:
											row.weather.tempMaxC == null
												? '—'
												: formatTemperatureDetail(
														row.weather.tempMaxC,
														data.displayUnits.temperature
													)
									})}
								</span>
								<span>
									{t('pages.logbook.weatherLow', {
										value:
											row.weather.tempMinC == null
												? '—'
												: formatTemperatureDetail(
														row.weather.tempMinC,
														data.displayUnits.temperature
													)
									})}
								</span>
								<span>
									{t('pages.logbook.weatherRainfall', {
										value:
											row.weather.precipMm == null
												? '—'
												: formatPrecipitation(row.weather.precipMm, data.displayUnits.precipitation)
									})}
								</span>
							</div>
							<WeatherChips
								chips={row.weatherChips}
								dateDisplay={data.dateDisplay}
								displayUnits={data.displayUnits}
							/>
						{:else}—{/if}
					</td>
					<td class="nowrap desktop-cell">
						<GradeChip grade={row.gradeLabel} band={row.gradeBand} />
					</td>
					<td class="tick-cell desktop-cell">
						<div class="tick-meta">
							<TickTypeIcon tick={row.tickType} />
							<div class="tick-styles">
								{#each logbookStyleLabels(row) as label (label)}
									<StyleBadge style={label} />
								{/each}
							</div>
						</div>
					</td>
					<td class="muted desktop-cell">{row.quality || '—'}</td>
					<td class="muted desktop-cell">{row.stars != null ? row.stars : '—'}</td>
					<td
						class="muted num desktop-cell"
						title={i18n.t('pages.logbook.titleYourAscentsOnThisRoute')}
					>
						{row.myAscentsOnRoute}
					</td>
					<td
						class="muted num desktop-cell"
						title={i18n.t('pages.logbook.titleCommunityPopularity')}
					>
						{row.routePopularity != null ? Math.round(row.routePopularity) : '—'}
					</td>
					<td class="muted desktop-cell">{row.partners || '—'}</td>
					<td class="desktop-cell">
						{#if row.cragName}
							<a
								href="/logbook?crag={encodeURIComponent(row.cragName)}"
								title={i18n.t('pages.logbook.titleFilterLogbookToThisCrag')}
							>
								{row.cragName}
							</a>
							{#if row.cragUrl}
								<a class="ext" href={row.cragUrl} target="_blank" rel="noreferrer">↗</a>
							{/if}
						{/if}
						{#if row.parentName}
							<div class="sector">
								<a href="/logbook?sector={encodeURIComponent(row.parentName)}">{row.parentName}</a>
							</div>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

{#if data.pages > 1}
	<nav class="pager">
		{#if data.page > 1}
			<a href={pageHref(data.page - 1)}>{t('pages.logbook.buttonPrev')}</a>
		{/if}
		<span>{t('pages.logbook.pageOf', { page: data.page, pages: data.pages })}</span>
		{#if data.page < data.pages}
			<a href={pageHref(data.page + 1)}>{t('pages.logbook.buttonNext')}</a>
		{/if}
	</nav>
{/if}

<style>
	.rock-filter select {
		width: 100%;
		min-width: 0;
	}

	.weather-values {
		display: grid;
		gap: 0.15rem;
		white-space: nowrap;
		font-size: 0.8rem;
		color: var(--ink-muted);
	}
	.weather-cell {
		min-width: 9rem;
	}
	@media (max-width: 1279px) {
		.weather-cell {
			display: none;
		}
	}
	@media (min-width: 1280px) {
		.route-weather-chips {
			display: none;
		}
	}

	.head,
	.filters,
	.table-wrap {
		padding: 1rem 1.15rem;
		border-radius: 1rem;
		margin-bottom: 0.85rem;
	}
	h1 {
		margin: 0;
	}
	.head p {
		margin: 0.25rem 0 0;
		color: var(--ink-muted);
	}
	.filters {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.filter-field,
	.rock-filter {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8rem;
		color: var(--ink-muted);
		min-width: 0;
	}
	.filter-help {
		margin: 0;
		font-size: 0.8rem;
		color: var(--ink-muted);
	}
	.search-field {
		grid-column: span 2;
	}
	.filter-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: 0.5rem;
		align-items: start;
	}
	.names-row {
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	.filter-row.actions {
		grid-template-columns: auto 1fr;
		justify-items: start;
	}
	.filters :global(input),
	.filters :global(select) {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		font: inherit;
		padding: 0.45rem 0.55rem;
		border-radius: 0.45rem;
		border: 1px solid var(--line);
		background: var(--paper);
	}
	.filters :global(input:not([type='checkbox']):not([type='hidden'])),
	.filters :global(select) {
		min-height: 2.6rem;
		font-size: 0.9rem;
		line-height: 1.3;
	}
	@media (max-width: 1100px) {
		.names-row {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 600px) {
		.names-row {
			grid-template-columns: minmax(0, 1fr);
		}
		.search-field {
			grid-column: auto;
		}
	}
	.filters button[type='submit'] {
		font: inherit;
		padding: 0.45rem 1rem;
		border-radius: 0.45rem;
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 700;
		cursor: pointer;
		justify-self: end;
	}
	.filters button[type='submit']:hover {
		background: var(--accent-strong);
	}
	.facet {
		margin: 0;
		padding: 0.55rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 0.55rem;
		background: var(--surface-2);
	}
	.facet legend {
		padding: 0 0.25rem;
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--ink-muted);
	}
	.checks {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.85rem;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: var(--ink-muted);
		white-space: nowrap;
	}
	.hint {
		margin: 0;
		font-size: 0.8rem;
		color: var(--ink-muted);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.92rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.55rem 0.4rem;
		border-bottom: 1px solid var(--line);
		vertical-align: top;
	}
	td.date {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	td.num {
		font-variant-numeric: tabular-nums;
		text-align: center;
	}
	th:has(a[href*='sort=ascents']),
	th:has(a[href*='sort=popularity']) {
		text-align: center;
	}
	td.nowrap {
		white-space: nowrap;
	}
	.tick-cell {
		min-width: 6.5rem;
	}
	.tick-meta {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		flex-wrap: wrap;
	}
	.tick-styles {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		align-items: center;
	}
	td.route {
		min-width: 12rem;
	}
	th a {
		color: inherit;
		text-decoration: none;
	}
	th {
		background: var(--surface-2);
		color: var(--ink-muted);
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding-block: 0.7rem;
		vertical-align: middle;
		white-space: nowrap;
	}
	tbody tr:hover td {
		background: var(--surface-2);
	}
	th a:hover {
		text-decoration: underline;
	}
	.muted {
		color: var(--ink-muted);
	}
	.note {
		margin-top: 0.25rem;
		font-size: 0.8rem;
		color: var(--ink-muted);
		white-space: pre-line;
		max-width: 48ch;
	}
	.note summary {
		cursor: pointer;
	}
	.note .note-full,
	.note[open] .note-preview {
		display: none;
	}
	.note[open] .note-full {
		display: inline;
	}
	.chip {
		display: inline-block;
		margin-left: 0.35rem;
		font-size: 0.72rem;
		padding: 0.05rem 0.35rem;
		border-radius: 999px;
		border: 1px solid var(--line);
		color: var(--ink-muted);
	}
	.chip.fa {
		border-color: var(--accent);
		color: var(--accent);
		font-weight: 700;
	}
	.fa-edit {
		display: flex;
		gap: 0.3rem;
		margin-top: 0.25rem;
		opacity: 0;
	}
	tr:hover .fa-edit,
	.fa-edit:focus-within {
		opacity: 1;
	}
	@media (hover: none) {
		.fa-edit {
			opacity: 1;
		}
	}
	.fa-edit button {
		font: inherit;
		font-size: 0.72rem;
		padding: 0.05rem 0.45rem;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--paper);
		color: var(--ink-muted);
		cursor: pointer;
	}
	.sector {
		font-size: 0.8rem;
		margin-top: 0.15rem;
	}
	.ext {
		margin-left: 0.25rem;
		font-size: 0.8rem;
		color: var(--ink-muted);
		text-decoration: none;
	}
	.pager {
		display: flex;
		justify-content: center;
		gap: 1rem;
		align-items: center;
		margin: 0.5rem 0 1.5rem;
	}
	@media (min-width: 861px) {
		/* The 11-column table needs more room than the sidebar leaves on many
		   laptops, so keep it scrollable rather than clipped. */
		.table-wrap {
			overflow-x: auto;
		}
		.card-head {
			display: block;
		}
		.mobile-grade,
		.mobile-sub,
		.mobile-styles,
		.mobile-partners {
			display: none;
		}
		.route-weather-chips :global(.location) {
			display: none;
		}
		th a.active {
			color: var(--accent);
		}
	}
	@media (max-width: 860px) {
		.table-wrap {
			padding: 0.75rem;
			overflow-x: visible;
		}
		table {
			display: block;
			min-width: 0;
			width: 100%;
		}
		thead {
			display: block;
			margin-bottom: 0.75rem;
		}
		thead tr {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.35rem;
			background: transparent;
		}
		thead th {
			display: inline-flex;
			padding: 0;
			background: transparent;
			border: none;
		}
		thead th:not(:has(a)) {
			display: none;
		}
		thead th a {
			display: inline-flex;
			align-items: center;
			padding: 0.25rem 0.6rem;
			border-radius: 999px;
			border: 1px solid var(--line);
			background: var(--surface-2);
			color: var(--ink);
			font-size: 0.75rem;
			font-weight: 600;
			text-decoration: none;
		}
		thead th a:hover {
			background: var(--surface-3);
			text-decoration: none;
		}
		thead th a.active {
			border-color: var(--accent);
			color: var(--ink);
			font-weight: 700;
			background: var(--surface-3);
		}
		tbody {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			width: 100%;
		}
		tbody tr {
			display: block;
			width: 100%;
			padding: 0.85rem 0.95rem;
			border-radius: 0.75rem;
			background: var(--surface-2);
			border: 1px solid var(--line);
		}
		tbody tr:hover td {
			background: transparent;
		}
		tbody td {
			padding: 0;
			border: none;
		}
		tbody td.desktop-cell {
			display: none;
		}
		tbody td.route {
			display: flex;
			flex-direction: column;
			gap: 0.35rem;
			width: 100%;
			min-width: 0;
		}
		.card-head {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			gap: 0.75rem;
		}
		.route-name {
			font-size: 1rem;
			font-weight: 700;
			line-height: 1.3;
			min-width: 0;
			overflow-wrap: anywhere;
		}
		.route-name a {
			color: inherit;
			text-decoration: underline;
			text-underline-offset: 2px;
		}
		.mobile-grade {
			display: inline-flex;
			flex-shrink: 0;
		}
		.mobile-sub {
			color: var(--ink-muted);
			font-size: 0.85rem;
			line-height: 1.5;
			overflow-wrap: anywhere;
		}
		.mobile-sub a {
			text-decoration: underline;
			text-underline-offset: 2px;
			color: inherit;
		}
		/* The arrow is bound to the crag name with a non-breaking space. */
		.mobile-sub .ext {
			margin-left: 0.2rem;
			text-decoration: none;
		}
		.mobile-styles {
			display: flex;
			flex-wrap: wrap;
			gap: 0.25rem;
			align-items: center;
		}
		.mobile-partners {
			font-size: 0.82rem;
			color: var(--ink-muted);
		}
		.fa-edit {
			opacity: 1;
		}
	}
</style>
