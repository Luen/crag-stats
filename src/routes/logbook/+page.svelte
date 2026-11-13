<script lang="ts">
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
	import { formatPrecipitation, formatTemperature } from '#lib/units';
	import WeatherChips from '#lib/components/WeatherChips.svelte';
	import {
		includeSelectedOptions,
		LOGBOOK_QUALITIES,
		LOGBOOK_STYLES,
		LOGBOOK_TICKS
	} from '#lib/logbookFilters';
	import { logbookStyleLabels } from '#lib/logbookStyle';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

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

	const WEATHER_LABELS = {
		heat: 'hot',
		freeze: 'freezing',
		rain: 'rainy',
		snow: 'snowy',
		fair: 'fair-weather',
		perfect: 'perfect-weather',
		wind: 'windy',
		calm: 'calm/still'
	} as const;

	function checked(list: string[], value: string) {
		return list.includes(value);
	}
</script>

<section class="panel head">
	<h1>Logbook</h1>
	{#if form?.message}<p role="alert">{form.message}</p>{/if}
	{#if data.place}<p>
			Climbing map place filter · <a href="/map">Back to map</a> ·
			<a href="/logbook">Clear place</a>
		</p>{/if}
	<p>
		{data.total} ascent{data.total === 1 ? '' : 's'}
		{#if data.route}
			· selected climb · <a href="/logbook">Clear climb</a>{/if}
		{#if data.score !== ''}
			· grade score {data.score}
		{/if}
		{#if data.tcMin !== '' && data.tcMax !== ''}
			· one pyramid grade row
		{/if}
		{#if data.day}
			· {data.day}
		{/if}
		{#if data.sector}
			· sector {data.sector}
		{/if}
		{#if data.sectorPath.length}
			· sector {data.sectorPath.join(' → ')} · <a href="/logbook">Clear sector</a>{/if}
		{#if data.fa}
			· FA {data.fa}
		{/if}
		{#if data.history === 'pending'}
			· history pending
		{/if}
		{#if data.project}
			· {data.project === 'yes' ? 'projects' : 'not projects'}
		{/if}
		{#if data.setter}
			· {data.setter === 'me' ? 'routes I set' : 'no setter credit found'}
		{/if}
		{#if data.weather}
			· {WEATHER_LABELS[data.weather]} days
		{/if}
		{#if data.weatherHighMin !== ''}
			· daily high ≥{formatTemperature(
				Number(data.weatherHighMin),
				data.displayUnits.temperature
			)}{/if}
		{#if data.weatherHighMax !== ''}
			· daily high &lt;{formatTemperature(
				Number(data.weatherHighMax),
				data.displayUnits.temperature
			)}{/if}
		{#if data.weatherHighMin !== '' || data.weatherHighMax !== ''}<a href={clearWeatherRangeHref()}
				>Clear weather range</a
			>{/if}
		{#if data.rock}
			· rock {data.rock}
		{/if}
		{#if data.tagExact.length}
			· tag {data.tagExact.join(', ')}
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
		<label class="filter-field search-field"
			>Search
			<input
				name="q"
				value={data.q}
				placeholder={data.notesShown
					? 'Search route, crag, partners, notes…'
					: 'Search route, crag, partners…'}
			/>
		</label>
		{#key data}
			<LogbookAutocomplete
				name="routeName"
				label="Route"
				value={data.options.routes.find((r) => r.key === String(data.route))?.value ??
					data.routeName}
				keyName="route"
				keyValue={String(data.route)}
				options={data.options.routes}
			/>
			<LogbookAutocomplete
				name="crag"
				label="Crag"
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
				label="Sector / parent"
				value={data.sector}
				keyName="sectorKey"
				keyValue={data.sectorKey}
				options={data.options.sectors}
			/>
			<LogbookAutocomplete
				name="with"
				label="With (partner name)"
				value={data.with}
				options={data.options.partners}
			/>
		{/key}
		<label class="filter-field"
			>Partner match
			<select name="partnerMatch" aria-label="Partner match" value={data.partnerMatch}>
				<option value="contains">Partner name contains</option>
				<option value="exact">Exact partner name</option>
			</select>
		</label>
		<label class="rock-filter"
			>Rock type
			<select
				name="rock"
				aria-label="Rock type"
				value={data.rock}
				aria-describedby={data.options.rocks.length ? undefined : 'rock-help'}
			>
				<option value="">Any rock type</option>
				{#if data.rock && !data.options.rocks.some((r) => r.value === data.rock)}
					<option value={data.rock}>{data.rock} (not in cached logbook)</option>
				{/if}
				{#each data.options.rocks as rock (rock.value)}<option value={rock.value}
						>{rock.label}</option
					>{/each}
			</select>
		</label>
	</div>

	{#if !data.options.rocks.length}<p class="filter-help" id="rock-help">
			No rock type tags cached for logged routes yet.
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
		<select name="solo" aria-label="Solo type" value={data.solo}>
			<option value="">Any solo type</option>
			{#each SOLO_KINDS as kind (kind.kind)}
				<option value={kind.kind}>{kind.label}</option>
			{/each}
		</select>
		<select name="band" aria-label="Grade band" value={String(data.band)}>
			<option value="">Any band</option>
			<option value="1">Beginner</option>
			<option value="2">Intermediate</option>
			<option value="3">Experienced</option>
			<option value="4">Expert</option>
			<option value="5">Elite</option>
		</select>
		<select name="minScore" aria-label="Minimum route grade" value={String(data.minScore)}>
			<option value="">Min route grade</option>
			{#each data.gradeOptions as g (g.score)}
				<option value={g.score}>{g.label}</option>
			{/each}
		</select>
		<select name="maxScore" aria-label="Maximum route grade" value={String(data.maxScore)}>
			<option value="">Max route grade</option>
			{#each data.gradeOptions as g (g.score)}
				<option value={g.score}>{g.label}</option>
			{/each}
		</select>
		<select name="fa" aria-label="First ascent mark" value={data.fa}>
			<option value="">Any FA mark</option>
			<option value="any">My FA or FFA</option>
			<option value="FA">My FA</option>
			<option value="FFA">My FFA</option>
			<option value="none">No FA/FFA mark</option>
		</select>
		<select name="setter" aria-label="Route setter" value={data.setter}>
			<option value="">Any setter</option>
			<option value="me">Routes I set</option>
			<option value="none">No setter credit found</option>
		</select>
		<select name="project" aria-label="theCrag project flag" value={data.project}>
			<option value="">Any project flag</option>
			<option value="yes">Project</option>
			<option value="no">Not a project</option>
		</select>
		{#if data.historyFilter}
			<select name="history" aria-label="Route history import" value={data.history}>
				<option value="">Any history status</option>
				<option value="pending">History not checked yet</option>
			</select>
		{/if}
		{#if data.weatherAvailable || data.weather}
			<select name="weather" aria-label="Weather on the day" value={data.weather}>
				<option value="">Any weather</option>
				<option value="fair"
					>Fair day ({data.displayUnits.temperature === 'fahrenheit' ? '59–77°F' : '15–25°C'}, dry)</option
				>
				<option value="perfect">Perfect day (fair, calm, not humid)</option>
				<option value="heat"
					>Hot day ({data.displayUnits.temperature === 'fahrenheit' ? '95°F+' : '35°C+'})</option
				>
				<option value="freeze"
					>Freezing ({data.displayUnits.temperature === 'fahrenheit'
						? 'low 32°F or below'
						: 'low 0°C or below'})</option
				>
				<option value="rain">Rainy day</option>
				<option value="snow">Snowy day</option>
				<option value="wind"
					>Windy day ({data.displayUnits.wind === 'mph' ? '31 mph+' : '50 km/h+'})</option
				>
				<option value="calm"
					>Calm / still day ({data.displayUnits.wind === 'mph'
						? 'under 16 mph'
						: 'under 25 km/h'})</option
				>
			</select>
		{/if}
		<select name="partners" aria-label="Partners" value={data.partners}>
			<option value="">Any partners</option>
			<option value="has">Has partners</option>
			<option value="missing">Missing partners</option>
		</select>
	</div>

	<fieldset class="facet">
		<legend>Style</legend>
		<div class="checks">
			{#each includeSelectedOptions(LOGBOOK_STYLES, data.styles) as style (style)}
				<label class="check">
					<input type="checkbox" name="style" value={style} checked={checked(data.styles, style)} />
					{style}
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="facet">
		<legend>Tick type</legend>
		<div class="checks">
			{#each includeSelectedOptions(LOGBOOK_TICKS, data.ticks) as tick (tick)}
				<label class="check">
					<input type="checkbox" name="tick" value={tick} checked={checked(data.ticks, tick)} />
					{tick}
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="facet">
		<legend>Quality</legend>
		<div class="checks">
			{#each LOGBOOK_QUALITIES as quality (quality)}
				<label class="check">
					<input
						type="checkbox"
						name="quality"
						value={quality}
						checked={checked(data.qualities, quality)}
					/>
					{quality}
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="facet">
		<legend>Min stars</legend>
		<div class="checks">
			<label class="check">
				<input type="radio" name="minStars" value="" checked={data.minStars === ''} />
				Any
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
		<legend>Missing route data</legend>
		<div class="checks">
			<label class="check">
				<input
					type="checkbox"
					name="missing"
					value="height"
					checked={checked(data.missing, 'height')}
				/>
				Missing height
			</label>
			<label class="check">
				<input
					type="checkbox"
					name="missing"
					value="bolts"
					checked={checked(data.missing, 'bolts')}
				/>
				Missing bolts
			</label>
			<label class="check">
				<input
					type="checkbox"
					name="missing"
					value="pitch"
					checked={checked(data.missing, 'pitch')}
				/>
				No pitch list cached
			</label>
			{#if data.canFilterMissingWeather}
				<label class="check">
					<input
						type="checkbox"
						name="missing"
						value="weather"
						checked={checked(data.missing, 'weather')}
					/>
					No weather cached
				</label>
			{/if}
		</div>
	</fieldset>

	<div class="filter-row">
		<input name="tag" value={data.tag} placeholder="Tag contains…" aria-label="Route tag" />
		{#each data.tagExact as exact, i (exact)}
			{#if i > 0}
				<input type="hidden" name="tagExact" value={exact} />
			{/if}
		{/each}
		<input
			name="tagExact"
			value={data.tagExact[0] ?? ''}
			placeholder="Exact tag (Steepness:Vertical)"
			aria-label="Exact route tag Category:Name"
		/>
	</div>

	<div class="filter-row actions">
		<label class="check">
			<input type="checkbox" name="multipitch" value="1" checked={data.multipitch} />
			Multipitch only
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
		<select name="sort" aria-label="Sort by" value={data.sort}>
			<option value="date">Sort: Date</option>
			<option value="grade">Sort: Grade</option>
			<option value="quality">Sort: Quality</option>
			<option value="stars">Sort: Stars</option>
			<option value="style">Sort: Style</option>
			<option value="tick">Sort: Tick</option>
			<option value="ascents">Sort: My ascents on route</option>
			<option value="popularity">Sort: Popularity</option>
		</select>
		<select name="order" aria-label="Sort order" value={data.order}>
			<option value="desc">Descending</option>
			<option value="asc">Ascending</option>
		</select>
		<button type="submit">Apply filters</button>
	</div>
	<p class="hint">
		From/to dates are inclusive. Unknown style finds missing, blank, or literal Unknown route
		styles, even with an ascent protection override; Other finds present, unsupported route styles.
		Route grade min/max use your display system and exclude boulders (filter style for those).
		Missing route data finds routes without a recorded height, bolt count, or cached pitch list
		after route info was fetched. No pitch list cached also matches single-pitch and boulder routes
		when theCrag omits pitches, so it is not a list of multipitch routes missing data. The
		pitch-list filter excludes routes whose route info was never fetched (History not checked is a
		separate, route-history filter); Tag contains searches tag names; Exact tag matches
		Category:Name (case-insensitive, repeat <code>tagExact</code> in the URL for AND). Categories include
		Rock type, Steepness, Aspect, Style, Weather, Walk in time, Legality, and Condition when shown on
		chips. Project filters exclude unknown flags. No setter credit found includes routes whose history
		has not been imported. Weather filters use the opt-in Open-Meteo cache and only match outdoor ascents
		with cached weather for that day; the owner can also list outdoor ascents with no weather cached yet.
	</p>
</form>

<section class="panel table-wrap">
	<table>
		<thead>
			<tr>
				<th><a href={sortHref('date')}>Date{sortMark('date')}</a></th>
				<th>Route</th>
				<th class="weather-cell">Weather</th>
				<th><a href={sortHref('grade')}>Grade{sortMark('grade')}</a></th>
				<th><a href={sortHref('tick')}>Tick{sortMark('tick')}</a></th>
				<th><a href={sortHref('quality')}>Quality{sortMark('quality')}</a></th>
				<th><a href={sortHref('stars')}>★{sortMark('stars')}</a></th>
				<th
					><a href={sortHref('ascents')} title="Your ascents on this route"
						>×{sortMark('ascents')}</a
					></th
				>
				<th
					><a href={sortHref('popularity')} title="Community popularity"
						>Pop.{sortMark('popularity')}</a
					></th
				>
				<th>With</th>
				<th>Crag / sector</th>
			</tr>
		</thead>
		<tbody>
			{#each data.rows as row (row.id)}
				<tr>
					<td class="date">{formatCalendarDate(row.ascentDate, data.dateDisplay)}</td>
					<td class="route">
						{#if row.url}
							<a href={row.url} target="_blank" rel="noreferrer">{row.displayName}</a>
						{:else}
							{row.displayName}
						{/if}
						{#if row.firstAscent}
							<span
								class="chip fa"
								title={row.firstAscent === 'FFA' ? 'First free ascent' : 'First ascent'}
								>{row.firstAscent}</span
							>
						{/if}
						{#if row.pitchLabel}
							<span class="chip">{row.pitchLabel}</span>
						{/if}
						{#if row.numberAttempts != null && row.numberAttempts > 1}
							<span class="chip">{row.numberAttempts} attempts</span>
						{/if}
						<TagChips tags={row.tags} />
						<!-- Narrow screens hide the Weather column; keep chips beside the route there. -->
						<span class="route-weather-chips">
							<WeatherChips
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
									<button type="submit" name="kind" value="">Unmark {row.firstAscent}</button>
								{:else}
									<button
										type="submit"
										name="kind"
										value="FA"
										aria-label="Mark {row.displayName} as my first ascent">Mark FA</button
									>
									<button
										type="submit"
										name="kind"
										value="FFA"
										aria-label="Mark {row.displayName} as my first free ascent">FFA</button
									>
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
					<td class="weather-cell">
						{#if row.weather}
							<div class="weather-values">
								{#if row.weatherLocation}<span title={row.weatherLocation.precision}
										>Location: {row.weatherLocation.source === 'place'
											? 'Approximate nearby place'
											: row.weatherLocation.source === 'route'
												? 'Route'
												: row.weatherLocation.source === 'polygon'
													? 'Approximate area polygon'
													: row.weatherLocation.source === 'cached'
														? 'Cached point'
														: 'Approximate crag/sector'} · {row.weatherLocation.name}</span
									>{/if}
								<span
									>High {row.weather.tempMaxC == null
										? '—'
										: formatTemperature(row.weather.tempMaxC, data.displayUnits.temperature)}</span
								>
								<span
									>Low {row.weather.tempMinC == null
										? '—'
										: formatTemperature(row.weather.tempMinC, data.displayUnits.temperature)}</span
								>
								<span
									>Rain {row.weather.precipMm == null
										? '—'
										: formatPrecipitation(
												row.weather.precipMm,
												data.displayUnits.precipitation
											)}</span
								>
							</div>
							<WeatherChips
								chips={row.weatherChips}
								dateDisplay={data.dateDisplay}
								displayUnits={data.displayUnits}
							/>
						{:else}—{/if}
					</td>
					<td class="nowrap"><GradeChip grade={row.gradeLabel} band={row.gradeBand} /></td>
					<td class="tick-cell">
						<div class="tick-meta">
							<TickTypeIcon tick={row.tickType} />
							<div class="tick-styles">
								{#each logbookStyleLabels(row) as label (label)}
									<StyleBadge style={label} />
								{/each}
							</div>
						</div>
					</td>
					<td class="muted">{row.quality || '—'}</td>
					<td class="muted">{row.stars != null ? row.stars : '—'}</td>
					<td class="muted num" title="Your ascents on this route">{row.myAscentsOnRoute}</td>
					<td class="muted num" title="Community popularity">
						{row.routePopularity != null ? Math.round(row.routePopularity) : '—'}
					</td>
					<td class="muted">{row.partners || '—'}</td>
					<td>
						{#if row.cragName}
							<a
								href="/logbook?crag={encodeURIComponent(row.cragName)}"
								title="Filter logbook to this crag">{row.cragName}</a
							>
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
			<a href={pageHref(data.page - 1)}>← Prev</a>
		{/if}
		<span>Page {data.page} / {data.pages}</span>
		{#if data.page < data.pages}
			<a href={pageHref(data.page + 1)}>Next →</a>
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
	@media (max-width: 900px) {
		.table-wrap {
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
		}
		table {
			min-width: 42rem;
		}
	}
</style>
