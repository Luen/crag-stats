<script lang="ts">
	import AscentHeatmap from '#lib/components/AscentHeatmap.svelte';
	import AthleteProfile from '#lib/components/AthleteProfile.svelte';
	import BarList from '#lib/components/BarList.svelte';
	import ClimberBlurb from '#lib/components/ClimberBlurb.svelte';
	import ClimberTypeBar from '#lib/components/ClimberTypeBar.svelte';
	import CprTimeline from '#lib/components/CprTimeline.svelte';
	import GradeChip from '#lib/components/GradeChip.svelte';
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
	import RockTypePanel from '#lib/components/RockTypePanel.svelte';
	import StarsScatter from '#lib/components/StarsScatter.svelte';
	import Streaks from '#lib/components/Streaks.svelte';
	import Eddington from '#lib/components/Eddington.svelte';
	import FirstAscents from '#lib/components/FirstAscents.svelte';
	import SoloClimbing from '#lib/components/SoloClimbing.svelte';
	import StyleMixChart from '#lib/components/StyleMixChart.svelte';
	import StylePyramid from '#lib/components/StylePyramid.svelte';
	import TagChips from '#lib/components/TagChips.svelte';
	import TickTypeIcon from '#lib/components/TickTypeIcon.svelte';
	import TrainingLoad from '#lib/components/TrainingLoad.svelte';
	import SessionsPerWeek from '#lib/components/SessionsPerWeek.svelte';
	import WeekdayStats from '#lib/components/WeekdayStats.svelte';
	import VolumeChart from '#lib/components/VolumeChart.svelte';
	import YearlyStats from '#lib/components/YearlyStats.svelte';
	import { packLayoutRows, type DashCardId } from '#lib/dashboardLayout';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
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
				if (i.id === 'weekday' && s.weekday.totalSessionsAllTime === 0) {
					return { ...i, enabled: false };
				}
				return i;
			})
		)
	);

	const systems = [
		{ id: 'ewbank', label: 'Ewbanks' },
		{ id: 'french', label: 'French' },
		{ id: 'yds', label: 'YDS' },
		{ id: 'v_scale', label: 'V-Scale' },
		{ id: 'font', label: 'Fontainebleau' }
	] as const;

	const pyramidModes = [
		{ id: 'all', label: 'All' },
		{ id: 'sends', label: 'Sends only' },
		{ id: 'onsight', label: 'Onsight only' }
	] as const;

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
		<ClimberBlurb paragraphs={s.blurb.paragraphs} />
	{:else if id === 'streaks'}
		<Streaks
			currentDays={s.streaks.currentDays}
			currentWeeks={s.streaks.currentWeeks}
			currentMonths={s.streaks.currentMonths}
			longestDays={s.streaks.longestDays}
			lastActiveDate={s.streaks.lastActiveDate}
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
		<AscentHeatmap data={s.heatmap} />
	{:else if id === 'volume'}
		<article class="panel">
			<h2>Volume</h2>
			<VolumeChart data={s.volumeByMonth} />
		</article>
	{:else if id === 'gradeBands'}
		<article class="panel">
			<h2>Grade bands</h2>
			<p class="hint">
				Colours match theCrag: Beginner → Elite · <a href="/docs/grades">About grade bands</a>
			</p>
			<BarList
				items={s.bandBreakdown.map((b) => ({
					id: `band:${b.band}`,
					label: b.name,
					value: b.count,
					color: b.color
				}))}
			/>
		</article>
	{:else if id === 'topCrags'}
		<article class="panel">
			<h2>Top crags</h2>
			<BarList
				items={s.topCrags.map((c) => ({
					id: `crag:${c.crag}`,
					label: c.crag,
					value: c.count,
					meta: c.maxGrade ? `up to ${c.maxGrade}` : undefined,
					color: 'var(--accent-2)',
					href: `/logbook?crag=${encodeURIComponent(c.crag)}`
				}))}
			/>
		</article>
	{:else if id === 'tickTypes'}
		<article class="panel">
			<h2>Tick types</h2>
			<BarList
				items={s.tickBreakdown.slice(0, 12).map((t) => ({
					id: `tick:${t.tick}`,
					label: t.tick,
					value: t.count
				}))}
			/>
		</article>
	{:else if id === 'monthly'}
		<MonthlyStats months={s.monthly.months} years={s.monthly.years} />
	{:else if id === 'yearly'}
		<YearlyStats years={s.yearly.years} days={s.heatmap} />
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
		<ProjectsHighlight projects={data.dashboardProjects} />
	{:else if id === 'trainingLoad'}
		<TrainingLoad load={s.trainingLoad} />
	{:else if id === 'sessionsPerWeek'}
		<SessionsPerWeek years={s.sessionsPerWeek.years} byYear={s.sessionsPerWeek.byYear} />
	{:else if id === 'weekday'}
		<WeekdayStats data={s.weekday} dateDisplay={data.dateDisplay} />
	{:else if id === 'milestones'}
		<Milestones items={s.milestones.items} limit={6} />
	{:else if id === 'styleMix'}
		<StyleMixChart months={s.styleMix.months} />
	{:else if id === 'partners'}
		<PartnerLeaderboard partners={s.partners} titleHref="/partners" />
	{:else if id === 'rockTypes'}
		<RockTypePanel
			types={s.rockTypes.types}
			dominant={s.rockTypes.dominant}
			info={s.rockTypes.info}
		/>
	{:else if id === 'stars'}
		<StarsScatter points={s.starsScatter} />
	{:else if id === 'quality'}
		<QualityBreakdown ratings={s.qualityBreakdown} />
	{:else if id === 'routePopularity' && s.routePopularity}
		<RoutePopularity data={s.routePopularity} dateDisplay={data.dateDisplay} />
	{:else if id === 'karma'}
		<Karma data={s.karma} dateDisplay={data.dateDisplay} />
	{:else if id === 'pyramids'}
		<header class="section-head">
			<h2>Grade pyramids</h2>
			<p>
				Split by style · grades shown in {systems.find((x) => x.id === data.gradeSystem)?.label ??
					data.gradeSystem}
			</p>
			<nav class="pyramid-toggles" aria-label="Pyramid filter">
				{#each pyramidModes as mode (mode.id)}
					<button
						type="button"
						class={{ active: pyramidMode === mode.id }}
						aria-pressed={pyramidMode === mode.id}
						onclick={() => (pyramidOverride = mode.id)}>{mode.label}</button
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
		<NotableAscents byStyle={s.notableByStyle} byArea={s.notableByArea} />
	{:else if id === 'cpr'}
		<header class="section-head">
			<h2>CPR timelines</h2>
			<p>Sport · Trad · Boulder performance over time</p>
		</header>
		<CprTimeline title="Sport" data={s.cpr.sport} />
		<CprTimeline title="Trad" data={s.cpr.trad} />
		<CprTimeline title="Boulder" data={s.cpr.boulder} />
	{:else if id === 'hardest'}
		{@const mixed = new Set(s.hardestSends.map((c) => c.discipline)).size > 1}
		<article class="panel">
			<h2>Hardest sends</h2>
			<ul class="list">
				{#each s.hardestSends as climb, i (climb.id)}
					{#if mixed && climb.discipline !== s.hardestSends[i - 1]?.discipline}
						<li class="group-label">{climb.discipline === 'boulder' ? 'Boulders' : 'Routes'}</li>
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
						</div>
						<GradeChip grade={climb.gradeLabel ?? climb.gradeRaw} band={climb.gradeBand} />
					</li>
				{/each}
			</ul>
		</article>
	{:else if id === 'recent'}
		<article class="panel">
			<h2>Recent activities</h2>
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
								{(climb.ascentDate || '').slice(0, 10)} · <TickTypeIcon tick={climb.tickType} /> ·
								{#if climb.cragName}
									<a href="/logbook?crag={encodeURIComponent(climb.cragName)}">{climb.cragName}</a>
								{/if}
								{#if climb.quality}
									· {climb.quality}
								{/if}
								{#if climb.partners}
									· with {climb.partners}
								{/if}
							</div>
							<TagChips tags={climb.tags} />
						</div>
						<GradeChip grade={climb.gradeLabel ?? climb.gradeRaw} band={climb.gradeBand} />
					</li>
				{/each}
			</ul>
			{#if s.recent.length > RECENT_LIMIT}
				<a class="more" href="/logbook">All ascents in the logbook →</a>
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
			<p class="eyebrow">Personal climbing analytics</p>
			<h1>{s.profileName ? `${s.profileName}'s crag year` : 'Your climbing, quantified'}</h1>
			<p class="lede">
				{s.climberType}. Turn theCrag history into performance analytics, projects, and training
				focus.
			</p>
		</div>
	</div>
	{#if data.showSettings && data.sync.status === 'error'}
		<a class="sync-alert" href="/settings">Last sync failed — open Settings</a>
	{/if}
</section>

{#if s.totalAscents === 0}
	<section class="panel empty">
		<h2>Get started</h2>
		<ol>
			<li>Add <code>THECRAG_API_KEY</code> for Supporters, or</li>
			<li>
				Upload a theCrag CSV export
				{#if data.showSettings}
					on <a href="/settings">Settings</a>
				{:else}
					via Settings (sign in at <a href="/login?next=/settings">/login</a>)
				{/if}
			</li>
		</ol>
	</section>
{:else}
	<section class="metrics">
		<div class="metric panel accent">
			<strong>{s.onsightCount}</strong>
			<span>onsighted</span>
		</div>
		<div class="metric panel">
			<strong>{s.totalSends}</strong>
			<span>successful ascents</span>
		</div>
		<div class="metric panel">
			<strong>{s.heightKm} km</strong>
			<span>distance climbed</span>
		</div>
		<div class="metric panel">
			<strong>{s.totalAscents}</strong>
			<span>total logged</span>
		</div>
		{#if s.outdoorAscents != null || s.indoorAscents != null}
			<div class="metric panel">
				<strong>{s.outdoorAscents ?? '—'}</strong>
				<span>outdoor</span>
			</div>
			<div class="metric panel">
				<strong>{s.indoorAscents ?? '—'}</strong>
				<span>indoor</span>
			</div>
		{/if}
	</section>

	{#if data.showSettings}
		<p class="customize"><a href="/settings#dashboard">Customize dashboard</a></p>
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
	.metric strong {
		font-size: 1.6rem;
		font-family: var(--font-display);
		font-weight: 750;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
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
