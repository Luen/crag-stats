<script lang="ts">
	import AscentHeatmap from '#lib/components/AscentHeatmap.svelte';
	import AthleteProfile from '#lib/components/AthleteProfile.svelte';
	import BarList from '#lib/components/BarList.svelte';
	import ClimberBlurb from '#lib/components/ClimberBlurb.svelte';
	import ClimberTypeBar from '#lib/components/ClimberTypeBar.svelte';
	import CprTimeline from '#lib/components/CprTimeline.svelte';
	import GradeChip from '#lib/components/GradeChip.svelte';
	import Milestones from '#lib/components/Milestones.svelte';
	import MonthlyStats from '#lib/components/MonthlyStats.svelte';
	import NotableAscents from '#lib/components/NotableAscents.svelte';
	import PartnerLeaderboard from '#lib/components/PartnerLeaderboard.svelte';
	import QualityBreakdown from '#lib/components/QualityBreakdown.svelte';
	import RockTypePanel from '#lib/components/RockTypePanel.svelte';
	import StarsScatter from '#lib/components/StarsScatter.svelte';
	import Streaks from '#lib/components/Streaks.svelte';
	import StyleMixChart from '#lib/components/StyleMixChart.svelte';
	import StylePyramid from '#lib/components/StylePyramid.svelte';
	import TagChips from '#lib/components/TagChips.svelte';
	import TickTypeIcon from '#lib/components/TickTypeIcon.svelte';
	import TrainingLoad from '#lib/components/TrainingLoad.svelte';
	import VolumeChart from '#lib/components/VolumeChart.svelte';
	import YearlyStats from '#lib/components/YearlyStats.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const s = $derived(data.stats);

	const systems = [
		{ id: 'ewbank', label: 'Ewbanks' },
		{ id: 'french', label: 'French' },
		{ id: 'yds', label: 'YDS' },
		{ id: 'v_scale', label: 'V-Scale' },
		{ id: 'font', label: 'Fontainebleau' }
	] as const;

	const pyramidModes = [
		{ id: 'all', label: 'Sends + attempts' },
		{ id: 'sends', label: 'Sends only' },
		{ id: 'onsight', label: 'Onsight only' }
	] as const;
</script>

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
	<div class="sync">
		<span class={['pill', { ok: data.sync.status === 'idle', err: data.sync.status === 'error' }]}>
			{data.sync.status}
		</span>
		{#if data.sync.lastSuccessAt}
			<small>Last sync {new Date(data.sync.lastSuccessAt).toLocaleString()}</small>
		{:else}
			<small>No API sync yet — import a CSV or sync from Settings</small>
		{/if}
		<form method="POST" action="?/setGradeSystem" class="grade-form">
			<label for="system">Grade system</label>
			<select id="system" name="system" onchange={(e) => e.currentTarget.form?.requestSubmit()}>
				{#each systems as opt (opt.id)}
					<option value={opt.id} selected={data.gradeSystem === opt.id}>{opt.label}</option>
				{/each}
			</select>
		</form>
	</div>
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

	<section class="stack">
		<ClimberTypeBar shares={s.styleShare} climberType={s.climberType} />
	</section>

	<section class="stack">
		<ClimberBlurb paragraphs={s.blurb.paragraphs} />
	</section>

	<section class="duo">
		<Streaks
			currentDays={s.streaks.currentDays}
			currentWeeks={s.streaks.currentWeeks}
			currentMonths={s.streaks.currentMonths}
			longestDays={s.streaks.longestDays}
			lastActiveDate={s.streaks.lastActiveDate}
		/>
		<AthleteProfile axes={s.athleteProfile.axes} />
	</section>

	<section class="stack">
		<AscentHeatmap data={s.heatmap} />
	</section>

	<section class="grid">
		<article class="panel">
			<h2>Volume</h2>
			<VolumeChart data={s.volumeByMonth} />
		</article>
		<article class="panel">
			<h2>Grade bands</h2>
			<p class="hint">Colours match theCrag: Beginner → Elite</p>
			<BarList
				items={s.bandBreakdown.map((b) => ({
					label: b.name,
					value: b.count,
					color: b.color
				}))}
			/>
		</article>
		<article class="panel">
			<h2>Top crags</h2>
			<BarList
				items={s.topCrags.map((c) => ({
					label: c.crag,
					value: c.count,
					meta: c.maxGrade ? `up to ${c.maxGrade}` : undefined,
					color: 'var(--accent-2)',
					href: `/logbook?crag=${encodeURIComponent(c.crag)}`
				}))}
			/>
		</article>
		<article class="panel">
			<h2>Tick types</h2>
			<BarList
				items={s.tickBreakdown.slice(0, 12).map((t) => ({
					label: t.tick,
					value: t.count
				}))}
			/>
		</article>
	</section>

	<section class="duo">
		<MonthlyStats months={s.monthly.months} years={s.monthly.years} />
		<YearlyStats years={s.yearly.years} />
	</section>

	<section class="duo">
		<TrainingLoad
			last7={s.trainingLoad.last7}
			last28={s.trainingLoad.last28}
			sendRate7={s.trainingLoad.sendRate7}
			sendRate28={s.trainingLoad.sendRate28}
			restDays7={s.trainingLoad.restDays7}
			restDays28={s.trainingLoad.restDays28}
		/>
		<Milestones items={s.milestones.items} />
	</section>

	<section class="stack">
		<StyleMixChart months={s.styleMix.months} />
	</section>

	<section class="grid">
		<PartnerLeaderboard partners={s.partners} />
		<RockTypePanel
			types={s.rockTypes.types}
			dominant={s.rockTypes.dominant}
			info={s.rockTypes.info}
		/>
		<StarsScatter points={s.starsScatter} />
		<QualityBreakdown ratings={s.qualityBreakdown} />
	</section>

	<section class="stack">
		<header class="section-head">
			<h2>Grade pyramids</h2>
			<p>Split by style · grades shown in your preferred system ({data.gradeSystem})</p>
			<nav class="pyramid-toggles" aria-label="Pyramid filter">
				{#each pyramidModes as mode (mode.id)}
					<a
						href="?pyramid={mode.id}"
						class={{ active: s.pyramidMode === mode.id }}
						aria-current={s.pyramidMode === mode.id ? 'page' : undefined}>{mode.label}</a
					>
				{/each}
			</nav>
		</header>
		<div class="pyramids">
			{#each s.stylePyramids as pyramid (pyramid.style)}
				<StylePyramid {pyramid} />
			{/each}
		</div>
	</section>

	<section class="stack">
		<NotableAscents byStyle={s.notableByStyle} byArea={s.notableByArea} />
	</section>

	<section class="stack">
		<header class="section-head">
			<h2>CPR timelines</h2>
			<p>Sport · Trad · Boulder performance over time</p>
		</header>
		<CprTimeline title="Sport" data={s.cpr.sport} />
		<CprTimeline title="Trad" data={s.cpr.trad} />
		<CprTimeline title="Boulder" data={s.cpr.boulder} />
	</section>

	<section class="grid">
		<article class="panel">
			<h2>Hardest sends</h2>
			<ul class="list">
				{#each s.hardestSends as climb (climb.routeName + (climb.ascentDate ?? ''))}
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
		<article class="panel">
			<h2>Recent</h2>
			<ul class="list">
				{#each s.recent as climb (climb.id)}
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
		</article>
	</section>
{/if}

<style>
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
		background: rgba(47, 93, 58, 0.12);
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
	.sync {
		display: grid;
		align-content: start;
		gap: 0.4rem;
		flex: 0 1 13rem;
		min-width: 0;
		max-width: 100%;
	}
	.pill {
		display: inline-flex;
		width: fit-content;
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		background: rgba(28, 36, 24, 0.08);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
	}
	.pill.ok {
		background: rgba(84, 180, 26, 0.2);
	}
	.pill.err {
		background: rgba(201, 9, 9, 0.15);
	}
	.grade-form {
		display: grid;
		gap: 0.25rem;
		margin-top: 0.35rem;
	}
	.grade-form label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--ink-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.grade-form select {
		font: inherit;
		padding: 0.4rem 0.55rem;
		border-radius: 0.45rem;
		border: 1px solid var(--line);
		background: white;
		width: 100%;
		max-width: 16rem;
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
		background: rgba(201, 9, 9, 0.08);
		border: 1px solid rgba(201, 9, 9, 0.22);
	}
	.metric span {
		display: block;
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	.metric strong {
		font-size: 1.55rem;
		font-family: Fraunces, Georgia, serif;
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
	.pyramid-toggles a {
		font-size: 0.8rem;
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		border: 1px solid var(--line);
		color: var(--ink-muted);
		text-decoration: none;
	}
	.pyramid-toggles a.active {
		background: var(--ink);
		color: var(--paper);
		border-color: var(--ink);
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
		font-size: 1.2rem;
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
	.sub {
		color: var(--ink-muted);
		font-size: 0.85rem;
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
		.sync {
			flex: 1 1 auto;
			width: 100%;
			padding-top: 0.75rem;
			border-top: 1px solid var(--line);
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
