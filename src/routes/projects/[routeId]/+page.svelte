<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import ProjectReadiness from '#lib/components/ProjectReadiness.svelte';
	import ProjectSelection from '#lib/components/ProjectSelection.svelte';
	import ProjectRouteBeta from '#lib/components/ProjectRouteBeta.svelte';
	import StyleBadge from '#lib/components/StyleBadge.svelte';
	import TickTypeIcon from '#lib/components/TickTypeIcon.svelte';
	import { formatCalendarDate, formatNumber } from '#lib/dates';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const i18n = useI18n();
	const p = $derived(data.project);
	const progress = $derived(data.progress);
	function count(n: number) {
		return formatNumber(n, data.dateDisplay);
	}
	function range(value: [number, number]) {
		return value[0] === value[1] ? count(value[0]) : `${count(value[0])}–${count(value[1])}`;
	}
</script>

<svelte:head>
	<title>{i18n.t('pages.projectDetail.pageTitle', { name: p.routeName })}</title>
</svelte:head>

<a class="back" href="/projects">{i18n.t('pages.projectDetail.linkAllProjects')}</a>
<header class="head">
	<p class="eyebrow">
		{p.status === 'sent'
			? i18n.t('pages.projectDetail.eyebrowSentProject')
			: i18n.t('pages.projects.titleWorkingOn')}
	</p>
	<h1>
		{p.routeName}{#if p.gradeLabel}
			· {p.gradeLabel}{/if}
	</h1>
	<p class="muted">{p.areaLabel}</p>
	{#if p.gearStyle}<StyleBadge style={p.gearStyle} />{/if}
	{#if p.href}<a href={p.href} target="_blank" rel="noreferrer">
			{i18n.t('pages.projectDetail.linkViewOnTheCrag')}
		</a>{/if}
</header>

{#if data.canManageProjects}
	<ProjectSelection
		provider={p.routeProvider}
		route={p.routeExternalId}
		name={p.routeName}
		decision={p.selection}
	/>
{/if}

<div class="overview">
	<section class="panel" aria-labelledby="readiness-title">
		<h2 id="readiness-title">{i18n.t('pages.projectDetail.titleProjectProgression')}</h2>
		<ProjectReadiness pct={progress.pct} horizon={progress.horizon} />
		<p class="totals">
			{i18n.t('pages.projectDetail.summaryTotals', {
				sessions: progress.stats.sessionCount,
				tries: progress.stats.tryCount,
				sends: progress.stats.sendCount
			})}
		</p>
		{#if progress.support}
			<p class="muted">
				{i18n.t('pages.projectDetail.leadSupportingPyramid', {
					n1: count(progress.support.n1),
					n2: count(progress.support.n2)
				})}
			</p>
		{/if}
		{#if progress.excludedEntries > 0}<p class="muted">
				{i18n.t('pages.projectDetail.hintExcludedEntries', {
					count: count(progress.excludedEntries)
				})}
			</p>{/if}
		<a href="#method">{i18n.t('pages.projectDetail.linkHowTheEstimateWorks')}</a>
	</section>
	<section class="panel" aria-labelledby="forecast-title">
		<h2 id="forecast-title">{i18n.t('pages.projectDetail.titleEstimatedWorkRemaining')}</h2>
		{#if progress.forecast}
			{@const forecast = progress.forecast}
			{#if forecast.sessions}<p class="estimate">
					{i18n.t('pages.projectDetail.estimateSessions', {
						range: range(forecast.sessions),
						count: forecast.sessions[1]
					})}
				</p>{:else}<p>{i18n.t('pages.projectDetail.estimateNoSessionData')}</p>{/if}
			{#if forecast.tries}<p class="estimate">
					{i18n.t('pages.projectDetail.estimateTries', { range: range(forecast.tries) })}
				</p>{:else}<p>{i18n.t('pages.projectDetail.estimateNoAttemptData')}</p>{/if}
			<p class="muted">
				{i18n.t('pages.projectDetail.leadHistoricalComparison', {
					count: count(forecast.sampleCount)
				})}
			</p>
			<p class="muted">
				{i18n.t('pages.projectDetail.noteRoughComparison')}
			</p>
		{:else}<p>
				{i18n.t('pages.projectDetail.noteProjectSent')}
			</p>{/if}
	</section>
</div>

{#if p.publicBeta}<div class="panel beta"><ProjectRouteBeta beta={p.publicBeta} /></div>{/if}

<section class="panel history" aria-labelledby="sessions-title">
	<h2 id="sessions-title">{i18n.t('pages.projectDetail.titleSessionProgression')}</h2>
	<p class="muted">
		{i18n.t('pages.projectDetail.leadReadinessRecalculated')}
	</p>
	{#if progress.sessions.length}
		<!-- Mobile table overflow must be scrollable with a keyboard. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			class="table-scroll"
			role="region"
			aria-label={i18n.t('pages.projectDetail.ariaSessionProgressionTable')}
			tabindex="0"
		>
			<table>
				<thead>
					<tr>
						<th>{i18n.t('pages.projectDetail.thClimbingDay')}</th><th>
							{i18n.t('pages.projectDetail.thFailedTries')}
						</th><th>{i18n.t('pages.projectDetail.thCumulativeFailedTries')}</th><th>
							{i18n.t('pages.projectDetail.thSends')}
						</th><th>{i18n.t('cards.projectReadiness.approximate')}</th>
					</tr>
				</thead><tbody>
					{#each progress.sessions as session (session.day)}<tr>
							<td>{formatCalendarDate(session.day, data.dateDisplay)}</td><td>
								{count(session.failedTries)}
							</td><td>{count(session.cumulativeTries)}</td><td>{count(session.sends)}</td><td>
								{session.readiness == null
									? i18n.t('pages.projectDetail.labelUnknownGrade')
									: `${count(session.readiness)}%`}
							</td>
						</tr>{/each}
				</tbody>
			</table>
		</div>
	{:else}<p>{i18n.t('pages.projectDetail.emptyNoValidDatedSessions')}</p>{/if}
</section>

<section class="panel history" aria-labelledby="tries-title">
	<h2 id="tries-title">{i18n.t('pages.projectDetail.titlePreviousTriesAndSends')}</h2>
	<p class="muted">
		{i18n.t('pages.projectDetail.leadNewestFirst')}
	</p>
	<ul class="tries">
		{#each data.attempts as attempt (attempt.id)}
			<li>
				<span>
					{attempt.day
						? formatCalendarDate(attempt.day, data.dateDisplay)
						: i18n.t('pages.projectDetail.labelUnknownClimbingDay')}
				</span>
				<TickTypeIcon tick={attempt.tickLabel || attempt.tickType} />
				{#if attempt.numberAttempts != null && attempt.numberAttempts > 0}<span>
						{count(attempt.numberAttempts)}
						{attempt.isSend
							? i18n.t('pages.projectDetail.triesIncludingSend')
							: i18n.t('pages.projectDetail.triesLogged')}
					</span>{/if}
				{#if attempt.grade}<span>{attempt.grade}</span>{/if}
				{#if attempt.pitchLabel}<span>{attempt.pitchLabel}</span>{/if}
			</li>
		{/each}
	</ul>
</section>

<details id="method" class="panel method">
	<summary>{i18n.t('pages.projectDetail.summary')}</summary>
	<p>
		{i18n.t('pages.projectDetail.methodReadiness')}
	</p>
	<p>
		{i18n.t('pages.projectDetail.methodPoints')}
	</p>
	<p>
		{i18n.t('pages.projectDetail.methodRanges')}
	</p>
	<p>
		{i18n.t('pages.projectDetail.methodSessions')}
	</p>
	<a href="/docs/projects">{i18n.t('pages.projectDetail.linkReadProjectsGuide')}</a>
</details>

<footer class="logbook-link">
	<a href={`/logbook?route=${p.routeId}`}>
		{i18n.t('pages.projectDetail.linkViewAllLoggedClimbs', { name: p.routeName })}
	</a>
</footer>

<style>
	.back {
		display: inline-block;
		margin-bottom: 1rem;
	}
	.head {
		margin-bottom: 1.5rem;
	}
	.head > a {
		display: inline-block;
		margin-left: 0.75rem;
	}
	.eyebrow {
		color: var(--accent);
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 700;
	}
	h1 {
		font-size: clamp(1.6rem, 4vw, 2.3rem);
		margin: 0;
	}
	h2 {
		font-size: 1.1rem;
		margin: 0 0 0.75rem;
	}
	a {
		color: var(--accent);
	}
	.muted {
		color: var(--ink-muted);
		font-size: 0.9rem;
		line-height: 1.5;
	}
	.overview {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
	.panel {
		padding: 1.2rem;
		border: 1px solid var(--line);
		border-radius: 1rem;
		background: var(--paper);
		min-width: 0;
	}
	.totals,
	.estimate {
		font-weight: 650;
	}
	.history,
	.method,
	.beta {
		margin-top: 1rem;
	}
	.table-scroll {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.7rem;
		border-bottom: 1px solid var(--line);
	}
	th {
		color: var(--ink-muted);
	}
	.tries {
		list-style: none;
		padding: 0;
		margin-bottom: 0;
	}
	.tries li {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		align-items: center;
		border-top: 1px solid var(--line);
		padding: 0.8rem 0;
		font-size: 0.9rem;
	}
	.method {
		font-size: 0.9rem;
		line-height: 1.55;
	}
	summary {
		cursor: pointer;
		font-weight: 650;
	}
	.logbook-link {
		padding: 1.5rem 0;
		font-weight: 650;
	}
	@media (max-width: 720px) {
		.overview {
			grid-template-columns: 1fr;
		}
	}
</style>
