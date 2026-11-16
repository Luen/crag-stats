<script lang="ts">
	import AscentHeatmap from '#lib/components/AscentHeatmap.svelte';
	import AthleteProfile from '#lib/components/AthleteProfile.svelte';
	import BarList from '#lib/components/BarList.svelte';
	import ClimberBlurb from '#lib/components/ClimberBlurb.svelte';
	import ClimberTypeBar from '#lib/components/ClimberTypeBar.svelte';
	import CprTimeline from '#lib/components/CprTimeline.svelte';
	import HelpLink from '#lib/components/HelpLink.svelte';
	import GradeChip from '#lib/components/GradeChip.svelte';
	import RichText from '#lib/components/RichText.svelte';
	import Badges from '#lib/components/Badges.svelte';
	import BestMonths from '#lib/components/BestMonths.svelte';
	import GoalsProgress from '#lib/components/GoalsProgress.svelte';
	import Milestones from '#lib/components/Milestones.svelte';
	import ProjectsHighlight from '#lib/components/ProjectsHighlight.svelte';
	import MonthlyStats from '#lib/components/MonthlyStats.svelte';
	import NotableAscents from '#lib/components/NotableAscents.svelte';
	import PartnerLeaderboard from '#lib/components/PartnerLeaderboard.svelte';
	import QualityBreakdown from '#lib/components/QualityBreakdown.svelte';
	import Karma from '#lib/components/Karma.svelte';
	import RoutePopularity from '#lib/components/RoutePopularity.svelte';
	import RouteRepeats from '#lib/components/RouteRepeats.svelte';
	import RockPerformance from '#lib/components/RockPerformance.svelte';
	import RockTypePanel from '#lib/components/RockTypePanel.svelte';
	import StarsScatter from '#lib/components/StarsScatter.svelte';
	import Streaks from '#lib/components/Streaks.svelte';
	import Eddington from '#lib/components/Eddington.svelte';
	import FirstAscents from '#lib/components/FirstAscents.svelte';
	import SoloClimbing from '#lib/components/SoloClimbing.svelte';
	import StyleMixChart from '#lib/components/StyleMixChart.svelte';
	import StylePyramid from '#lib/components/StylePyramid.svelte';
	import TagChips from '#lib/components/TagChips.svelte';
	import { describeDisplaySystems, getBandName } from '#lib/grades';
	import { formatCalendarDate } from '#lib/dates';
	import { formatDistance } from '#lib/units';
	import { useI18n } from '#lib/i18n';
	import TickTypeIcon from '#lib/components/TickTypeIcon.svelte';
	import StyleBadge from '#lib/components/StyleBadge.svelte';
	import TrainingLoad from '#lib/components/TrainingLoad.svelte';
	import SessionsPerWeek from '#lib/components/SessionsPerWeek.svelte';
	import WeatherChips from '#lib/components/WeatherChips.svelte';
	import WeatherConditions from '#lib/components/WeatherConditions.svelte';
	import WeatherPerformance from '#lib/components/WeatherPerformance.svelte';
	import WeekdayStats from '#lib/components/WeekdayStats.svelte';
	import VolumeChart from '#lib/components/VolumeChart.svelte';
	import YearlyStats from '#lib/components/YearlyStats.svelte';
	import { packLayoutRows, type DashCardId } from '#lib/dashboardLayout';
	import { ascentPartners } from '#lib/partnerStats';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
	const s = $derived(data.stats);
	// Visitors don't get an empty First ascents card; the owner sees how to mark one.
	const rows = $derived(
		packLayoutRows(
			data.dashLayout.map((i) => {
				if (
					i.id === 'firstAscents' &&
					!data.showSettings &&
					s.firstAscents.total === 0 &&
					s.firstAscents.routesSet === 0
				) {
					return { ...i, enabled: false };
				}
				if (i.id === 'routePopularity' && s.routePopularity == null) {
					return { ...i, enabled: false };
				}
				if (i.id === 'karma' && s.karma.ascentPoints === 0 && s.karma.routesLogged === 0) {
					return { ...i, enabled: false };
				}
				if (i.id === 'bestMonths' && s.bestMonths.cragCount === 0) {
					return { ...i, enabled: false };
				}
				if (i.id === 'weekday' && s.weekday.allTime.all.totalSessions === 0) {
					return { ...i, enabled: false };
				}
				if (i.id === 'weatherConditions' && s.weatherConditions == null) {
					return { ...i, enabled: false };
				}
				if (i.id === 'weatherPerformance' && s.weatherPerformance == null) {
					return { ...i, enabled: false };
				}
				if (i.id === 'rockPerformance' && s.rockPerformance == null) {
					return { ...i, enabled: false };
				}
				if (i.id === 'routeRepeats' && s.routeRepeats == null) {
					return { ...i, enabled: false };
				}
				return i;
			})
		)
	);

	const pyramidModes = [
		{ id: 'all', key: 'pages.dashboard.optionAll' },
		{ id: 'sends', key: 'pages.dashboard.optionSendsOnly' },
		{ id: 'onsight', key: 'pages.dashboard.optionOnsightOnly' }
	] as const;

	// Grade-record tiles carry translated headings and empty states, so build them beside the locale.
	const gradeRecordSummaries = $derived([
		{
			id: 'send',
			label: i18n.t('pages.dashboard.labelHardestSend'),
			records: s.gradeRecords.sends,
			empty: i18n.t('pages.dashboard.emptyNoGradedSends')
		},
		{
			id: 'onsightFlash',
			label: i18n.t('pages.dashboard.labelHardestOnsightFlash'),
			records: s.gradeRecords.onsightFlash,
			empty: i18n.t('pages.dashboard.emptyNoGradedOnsights')
		}
	]);

	// Recent rows carry tags, so they run taller than Hardest sends beside them; a short
	// list keeps the two cards level instead of leaving a blank column under the shorter one.
	const RECENT_LIMIT = 5;

	// Every filter ships with the page, so switching is local state: no navigation, no
	// scroll jump. `?pyramid=` still picks the starting filter for shared links.
	let pyramidOverride = $state<(typeof pyramidModes)[number]['id'] | null>(null);
	const pyramidMode = $derived(pyramidOverride ?? data.pyramidMode);
</script>

{#snippet card(id: DashCardId)}
	{#if id === 'climberType'}
		<ClimberTypeBar shares={s.styleShare} climberType={s.climberType} />
	{:else if id === 'blurb'}
		<ClimberBlurb paragraphs={s.blurb.paragraphs} routeLink={s.blurb.routeLink} />
	{:else if id === 'streaks'}
		<Streaks
			currentDays={s.streaks.currentDays}
			currentWeeks={s.streaks.currentWeeks}
			currentMonths={s.streaks.currentMonths}
			longestDays={s.streaks.longestDays}
			longestStartDate={s.streaks.longestStartDate}
			longestEndDate={s.streaks.longestEndDate}
			dateDisplay={data.dateDisplay}
			lastActiveDate={s.streaks.lastActiveDate}
			activeDays={s.streaks.activeDays}
			daysSinceLastActive={s.streaks.daysSinceLastActive}
		/>
	{:else if id === 'eddington'}
		<Eddington data={s.eddington} />
	{:else if id === 'firstAscents'}
		<FirstAscents
			data={s.firstAscents}
			canEdit={data.showSettings}
			dateDisplay={data.dateDisplay}
		/>
	{:else if id === 'solo'}
		<SoloClimbing data={s.solo} />
	{:else if id === 'athleteProfile'}
		<AthleteProfile axes={s.athleteProfile.axes} />
	{:else if id === 'heatmap'}
		<AscentHeatmap
			preferences={data.cardPreferences}
			data={s.heatmap}
			dateDisplay={data.dateDisplay}
			displayUnits={data.displayUnits}
		/>
	{:else if id === 'volume'}
		<article class="panel">
			<h2>{i18n.t('pages.dashboard.titleVolume')}</h2>
			<VolumeChart data={s.volumeByMonth} />
		</article>
	{:else if id === 'gradeBands'}
		<article class="panel">
			<div class="card-title">
				<h2>{i18n.t('pages.dashboard.titleGradeBands')}</h2>
				<HelpLink href="/docs/grades" label={i18n.t('pages.dashboard.ariaAboutGradeBands')} />
			</div>
			<p class="hint">
				{i18n.t('pages.dashboard.hintGradeBandColours', {
					from: getBandName(1, i18n.locale),
					to: getBandName(5, i18n.locale)
				})}
			</p>
			<BarList
				items={s.bandBreakdown.map((b) => ({
					id: `band:${b.band}`,
					label: getBandName(b.band, i18n.locale),
					value: b.count,
					color: b.color
				}))}
			/>
		</article>
	{:else if id === 'topCrags'}
		<article class="panel">
			<h2>{i18n.t('pages.dashboard.titleTopCrags')}</h2>
			<BarList
				items={s.topCrags.map((c) => ({
					id: `crag:${c.crag}`,
					label: c.crag,
					value: c.count,
					meta: c.maxGrade
						? i18n.t('pages.dashboard.metaUpToGrade', { grade: c.maxGrade })
						: undefined,
					color: 'var(--accent-2)',
					href: `/logbook?crag=${encodeURIComponent(c.crag)}`
				}))}
			/>
		</article>
	{:else if id === 'tickTypes'}
		<article class="panel">
			<h2>{i18n.t('pages.dashboard.titleTickTypes')}</h2>
			<BarList
				items={s.tickBreakdown.slice(0, 12).map((t) => ({
					id: `tick:${t.tick}`,
					label: t.tick,
					value: t.count
				}))}
			/>
		</article>
	{:else if id === 'monthly'}
		<MonthlyStats
			months={s.monthly.months}
			years={s.monthly.years}
			displayUnits={data.displayUnits}
		/>
	{:else if id === 'yearly'}
		<YearlyStats
			preferences={data.cardPreferences}
			years={s.yearly.years}
			days={s.heatmap}
			displayUnits={data.displayUnits}
			dateDisplay={data.dateDisplay}
		/>
	{:else if id === 'bestMonths'}
		<BestMonths data={s.bestMonths} />
	{:else if id === 'badges'}
		<Badges
			earned={s.badges.earned}
			locked={s.badges.locked}
			earnedCount={s.badges.earnedCount}
			totalCount={s.badges.totalCount}
			recentLimit={8}
		/>
	{:else if id === 'goals'}
		<GoalsProgress goals={data.activeGoals} canEdit={data.showSettings} />
	{:else if id === 'projects'}
		<ProjectsHighlight projects={data.dashboardProjects} dateDisplay={data.dateDisplay} />
	{:else if id === 'trainingLoad'}
		<TrainingLoad
			load={s.trainingLoad}
			gradeSystems={data.gradeSystems}
			displayUnits={data.displayUnits}
			dateDisplay={data.dateDisplay}
		/>
	{:else if id === 'sessionsPerWeek'}
		<SessionsPerWeek years={s.sessionsPerWeek.years} byYear={s.sessionsPerWeek.byYear} />
	{:else if id === 'weekday'}
		<WeekdayStats
			preferences={data.cardPreferences}
			data={s.weekday}
			dateDisplay={data.dateDisplay}
		/>
	{:else if id === 'weatherConditions' && s.weatherConditions}
		<WeatherConditions
			data={s.weatherConditions}
			dateDisplay={data.dateDisplay}
			displayUnits={data.displayUnits}
		/>
	{:else if id === 'weatherPerformance' && s.weatherPerformance}
		<WeatherPerformance data={s.weatherPerformance} dateDisplay={data.dateDisplay} />
	{:else if id === 'milestones'}
		<Milestones items={s.milestones.items} limit={6} dateDisplay={data.dateDisplay} />
	{:else if id === 'styleMix'}
		<StyleMixChart months={s.styleMix.months} />
	{:else if id === 'partners'}
		<PartnerLeaderboard
			preferences={data.cardPreferences}
			partners={s.partners}
			titleHref="/partners"
			metricToggle
			compact
			limit={7}
		/>
	{:else if id === 'rockTypes'}
		<RockTypePanel
			types={s.rockTypes.types}
			dominant={s.rockTypes.dominant}
			info={s.rockTypes.info}
		/>
	{:else if id === 'rockPerformance' && s.rockPerformance}
		<RockPerformance data={s.rockPerformance} dateDisplay={data.dateDisplay} />
	{:else if id === 'stars'}
		<StarsScatter points={s.starsScatter} gradeSystems={data.gradeSystems} />
	{:else if id === 'quality'}
		<QualityBreakdown ratings={s.qualityBreakdown} />
	{:else if id === 'routePopularity' && s.routePopularity}
		<RoutePopularity data={s.routePopularity} dateDisplay={data.dateDisplay} />
	{:else if id === 'routeRepeats' && s.routeRepeats}
		<RouteRepeats
			preferences={data.cardPreferences}
			data={s.routeRepeats}
			dateDisplay={data.dateDisplay}
		/>
	{:else if id === 'karma'}
		<Karma data={s.karma} dateDisplay={data.dateDisplay} />
	{:else if id === 'pyramids'}
		<header class="section-head">
			<h2>{i18n.t('pages.dashboard.titleGradePyramids')}</h2>
			<p>
				{i18n.t('pages.dashboard.leadPyramids', {
					systems: describeDisplaySystems(data.gradeSystems)
				})}
			</p>
			<nav class="pyramid-toggles" aria-label={i18n.t('pages.dashboard.ariaPyramidFilter')}>
				{#each pyramidModes as mode (mode.id)}
					<button
						type="button"
						class={{ active: pyramidMode === mode.id }}
						aria-pressed={pyramidMode === mode.id}
						onclick={() => (pyramidOverride = mode.id)}>{i18n.t(mode.key)}</button
					>
				{/each}
			</nav>
		</header>
		<div class="pyramids">
			{#each s.stylePyramidsByMode[pyramidMode] as pyramid (pyramid.style)}
				<StylePyramid {pyramid} />
			{/each}
		</div>
	{:else if id === 'notable'}
		<NotableAscents
			byStyle={s.notableByStyle}
			byArea={s.notableByArea}
			dateDisplay={data.dateDisplay}
		/>
	{:else if id === 'cpr'}
		<header class="section-head">
			<h2>{i18n.t('pages.dashboard.titleCPRTimelines')}</h2>
			<p>{i18n.t('pages.dashboard.leadCpr')}</p>
		</header>
		<CprTimeline
			title={i18n.t('pages.dashboard.titleSport')}
			style="Sport"
			data={s.cpr.sport}
			gradeSystems={data.gradeSystems}
		/>
		<CprTimeline
			title={i18n.t('pages.dashboard.titleTrad')}
			style="Trad"
			data={s.cpr.trad}
			gradeSystems={data.gradeSystems}
		/>
		<CprTimeline
			title={i18n.t('pages.dashboard.titleBoulder')}
			style="Boulder"
			data={s.cpr.boulder}
			gradeSystems={data.gradeSystems}
		/>
	{:else if id === 'hardest'}
		{@const mixed = new Set(s.hardestSends.map((c) => c.discipline)).size > 1}
		<article class="panel">
			<h2>{i18n.t('pages.dashboard.titleHardestSends')}</h2>
			<ul class="list">
				{#each s.hardestSends as climb, i (climb.id)}
					{#if mixed && climb.discipline !== s.hardestSends[i - 1]?.discipline}
						<li class="group-label">
							{climb.discipline === 'boulder'
								? i18n.t('pages.dashboard.labelBoulders')
								: i18n.t('pages.dashboard.labelRoutes')}
						</li>
					{/if}
					<li>
						<div>
							<strong>
								{#if climb.url}
									<a href={climb.url} target="_blank" rel="noreferrer">{climb.routeName}</a>
								{:else}
									{climb.routeName}
								{/if}
							</strong>
							<div class="sub">
								{#if climb.cragUrl && climb.cragName}
									<a href={climb.cragUrl} target="_blank" rel="noreferrer">{climb.cragName}</a>
								{:else}
									{climb.cragName}
								{/if}
								· <TickTypeIcon tick={climb.tickType} />
							</div>
							{#if ascentPartners(climb.partners)}
								<div class="sub companions">{ascentPartners(climb.partners)}</div>
							{/if}
						</div>
						<GradeChip grade={climb.gradeLabel ?? climb.gradeRaw} band={climb.gradeBand} />
					</li>
				{/each}
			</ul>
		</article>
	{:else if id === 'recent'}
		<article class="panel">
			<h2>{i18n.t('pages.dashboard.titleRecentActivities')}</h2>
			<ul class="list">
				{#each s.recent.slice(0, RECENT_LIMIT) as climb (climb.id)}
					<li>
						<div>
							<strong>
								{#if climb.url}
									<a href={climb.url} target="_blank" rel="noreferrer">{climb.routeName}</a>
								{:else}
									{climb.routeName}
								{/if}
							</strong>
							<div class="sub">
								{formatCalendarDate(climb.ascentDate, data.dateDisplay)} · <TickTypeIcon
									tick={climb.tickType}
								/> ·
								{#if climb.cragName}
									<a href="/logbook?crag={encodeURIComponent(climb.cragName)}">{climb.cragName}</a>
								{/if}
								{#if climb.quality}
									· {climb.quality}
								{/if}
							</div>
							<div
								class="recent-styles"
								role="group"
								aria-label={i18n.t('pages.dashboard.ariaClimbStyles')}
							>
								{#each climb.styleLabels as style (style)}<StyleBadge {style} />{/each}
							</div>
							{#if ascentPartners(climb.partners)}
								<div class="sub companions">{ascentPartners(climb.partners)}</div>
							{/if}
							<TagChips tags={climb.tags} />
							<WeatherChips
								location={climb.weatherLocation}
								chips={climb.weatherChips}
								dateDisplay={data.dateDisplay}
								displayUnits={data.displayUnits}
							/>
						</div>
						<GradeChip grade={climb.gradeLabel ?? climb.gradeRaw} band={climb.gradeBand} />
					</li>
				{/each}
			</ul>
			{#if s.recent.length > RECENT_LIMIT}
				<a class="more" href="/logbook">{i18n.t('pages.dashboard.linkAllAscents')}</a>
			{/if}
		</article>
	{/if}
{/snippet}

<section class="hero panel">
	<div class="hero-main">
		{#if s.avatar}
			<img class="avatar" src={s.avatar} alt="" width="72" height="72" />
		{/if}
		<div>
			<p class="eyebrow">{i18n.t('pages.dashboard.eyebrowPersonalAnalytics')}</p>
			<h1>
				{s.profileName
					? i18n.t('pages.dashboard.titleCragYear', { name: s.profileName })
					: i18n.t('pages.dashboard.titleClimbingQuantified')}
			</h1>
			<p class="lede">
				{i18n.t('pages.dashboard.leadTagline', { climberType: s.climberType })}
			</p>
		</div>
	</div>
	{#if data.showSettings && data.sync.status === 'error'}
		<a class="sync-alert" href="/settings">{i18n.t('pages.dashboard.linkLastSyncFailed')}</a>
	{/if}
</section>

{#if s.totalLogged === 0}
	<section class="panel empty">
		<h2>{i18n.t('pages.dashboard.titleGetStarted')}</h2>
		<ol>
			<li>
				<RichText
					message={i18n.t('pages.dashboard.stepAddApiKey')}
					tokens={{ apiKey: { kind: 'code', text: 'THECRAG_API_KEY' } }}
				/>
			</li>
			<li>
				{#if data.showSettings}
					<RichText
						message={i18n.t('pages.dashboard.stepUploadCsvOnSettings')}
						tokens={{
							settings: {
								kind: 'link',
								text: i18n.t('nav.settings'),
								href: '/settings'
							}
						}}
					/>
				{:else}
					<RichText
						message={i18n.t('pages.dashboard.stepUploadCsvViaSettings')}
						tokens={{
							login: {
								kind: 'link',
								text: '/login',
								href: '/login?next=/settings'
							}
						}}
					/>
				{/if}
			</li>
		</ol>
	</section>
{:else}
	<section class="metrics">
		{#each gradeRecordSummaries as summary (summary.id)}
			<article class="metric panel accent grade-record" aria-label={summary.label}>
				<h2>{summary.label}</h2>
				{#each summary.records as record (record.discipline)}
					<div class="record-entry">
						<strong>
							{#if record.href}
								<a
									href={record.href}
									aria-label="{record.grade} · {record.tick} · {record.routeName}">{record.grade}</a
								>
							{:else}{record.grade}{/if}
						</strong>
						<span
							>{record.discipline === 'route'
								? i18n.t('pages.dashboard.labelRoutes')
								: i18n.t('pages.dashboard.labelBoulders')} · {record.tick}</span
						>
					</div>
				{:else}
					<strong>—</strong><span>{summary.empty}</span>
				{/each}
			</article>
		{/each}
		<div class="metric panel accent">
			<strong>{s.onsightCount}</strong>
			<span>{i18n.t('pages.dashboard.labelOnsighted')}</span>
		</div>
		<div class="metric panel">
			<strong>{s.totalSends}</strong>
			<span>{i18n.t('pages.dashboard.labelSuccessfulAscents')}</span>
		</div>
		<div class="metric panel">
			<strong>{formatDistance(s.heightKm, data.displayUnits.distance)}</strong>
			<span>{i18n.t('pages.dashboard.labelDistanceClimbed')}</span>
		</div>
		<div class="metric panel">
			<strong>{s.totalAscents}</strong>
			<span
				>{s.isFiltered
					? i18n.t('pages.dashboard.labelCountedAscents')
					: i18n.t('pages.dashboard.labelTotalLogged')}</span
			>
			{#if s.isFiltered}
				<span class="sub"
					>{i18n.t('pages.dashboard.labelTotalLoggedCount', { count: s.totalLogged })}</span
				>
			{/if}
		</div>
		{#if s.outdoorAscents != null || s.indoorAscents != null}
			<div class="metric panel">
				<strong>{s.outdoorAscents ?? '—'}</strong>
				<span>{i18n.t('pages.dashboard.labelOutdoor')}</span>
			</div>
			<div class="metric panel">
				<strong>{s.indoorAscents ?? '—'}</strong>
				<span>{i18n.t('pages.dashboard.labelIndoor')}</span>
			</div>
		{/if}
	</section>

	{#if data.showSettings}
		<p class="customize">
			<a href="/settings#dashboard">{i18n.t('pages.dashboard.linkCustomizeDashboard')}</a>
		</p>
	{/if}

	{#each rows as row, ri (ri)}
		{#if row.kind === 'full'}
			<section class="stack">
				{@render card(row.id)}
			</section>
		{:else if row.kind === 'duo'}
			<section class="duo">
				{#each row.ids as id (id)}
					{@render card(id)}
				{/each}
			</section>
		{:else}
			<section class="grid">
				{#each row.ids as id (id)}
					{@render card(id)}
				{/each}
			</section>
		{/if}
	{/each}
{/if}

<style>
	.recent-styles {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin: 0.25rem 0;
	}
	.companions {
		overflow-wrap: anywhere;
	}
	.customize {
		margin: 0 0 0.75rem;
		text-align: right;
		font-size: 0.85rem;
	}
	.customize a {
		color: var(--accent);
		font-weight: 600;
	}
	.customize a:hover {
		text-decoration: underline;
	}
	.hero {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1.25rem;
		padding: 1.4rem 1.5rem;
		margin-bottom: 1rem;
		border-radius: 1rem;
	}
	.hero-main {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		min-width: 0;
		flex: 1 1 16rem;
	}
	.avatar {
		width: 4.5rem;
		height: 4.5rem;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--line);
		flex-shrink: 0;
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}
	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.75rem;
		color: var(--ink-muted);
		margin: 0 0 0.35rem;
		font-weight: 700;
	}
	h1 {
		margin: 0;
		font-size: clamp(1.45rem, 5.5vw, 2.6rem);
		max-width: 18ch;
		line-height: 1.1;
		overflow-wrap: anywhere;
	}
	.lede {
		margin: 0.7rem 0 0;
		max-width: 46ch;
		color: var(--ink-muted);
	}
	.sync-alert {
		align-self: flex-start;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--band-expert);
		background: color-mix(in srgb, var(--band-expert) 10%, var(--paper));
		border: 1px solid color-mix(in srgb, var(--band-expert) 30%, transparent);
		border-radius: 999px;
		padding: 0.25rem 0.75rem;
	}
	.metrics {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	.metric {
		padding: 1rem 1.1rem;
		border-radius: 0.9rem;
	}
	.metric.accent {
		background: var(--accent-soft);
		border-color: color-mix(in srgb, var(--accent) 30%, transparent);
	}
	.metric.accent strong {
		color: var(--accent);
	}
	.metric span {
		display: block;
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	.metric .sub {
		font-size: 0.75rem;
		margin-top: 0.15rem;
	}
	.metric strong {
		font-size: 1.6rem;
		font-family: var(--font-display);
		font-weight: 750;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}
	.grade-record h2 {
		font-size: 0.85rem;
		font-weight: 650;
		margin: 0 0 0.35rem;
		color: var(--ink);
	}
	.record-entry {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.2rem 0.65rem;
	}
	.record-entry a:hover {
		text-decoration: underline;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.9rem;
		margin-bottom: 1rem;
	}
	.stack {
		display: grid;
		gap: 0.9rem;
		margin-bottom: 1rem;
	}
	.duo {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
		margin-bottom: 1rem;
	}
	.section-head h2 {
		margin: 0;
	}
	.section-head p {
		margin: 0.25rem 0 0;
		color: var(--ink-muted);
	}
	.pyramid-toggles {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.65rem;
	}
	.pyramid-toggles button {
		font: inherit;
		font-size: 0.8rem;
		background: none;
		cursor: pointer;
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		border: 1px solid var(--line);
		color: var(--ink-muted);
		text-decoration: none;
	}
	.pyramid-toggles button.active {
		background: var(--accent);
		color: var(--on-accent);
		border-color: var(--accent);
	}
	.pyramids {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 0.9rem;
	}
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h2 {
		margin: 0 0 0.85rem;
		font-size: 1.1rem;
	}
	.card-title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.85rem;
	}
	.card-title h2 {
		margin: 0;
	}
	.hint {
		margin: -0.4rem 0 0.8rem;
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.7rem;
	}
	.list li {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: center;
	}
	.list li.group-label {
		margin-top: 0.3rem;
		color: var(--ink-muted);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.sub {
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	.more {
		display: inline-block;
		margin-top: 0.85rem;
		font-size: 0.85rem;
		color: var(--ink-muted);
	}
	.list a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.empty {
		padding: 1.25rem 1.4rem;
		border-radius: 1rem;
	}
	.empty ol {
		margin: 0.5rem 0 0;
		color: var(--ink-muted);
	}
	@media (max-width: 840px) {
		.hero {
			flex-direction: column;
			padding: 1.1rem 1rem;
			gap: 1rem;
		}
		.hero-main {
			flex: 1 1 auto;
			width: 100%;
		}
		.avatar {
			width: 3.5rem;
			height: 3.5rem;
		}
		.metrics {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.grid,
		.duo {
			grid-template-columns: 1fr;
		}
		.pyramids {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 420px) {
		.metrics {
			grid-template-columns: 1fr;
		}
		.metric strong {
			font-size: 1.35rem;
		}
	}
</style>
