<script lang="ts">
	import ProjectReadiness from '#lib/components/ProjectReadiness.svelte';
	import ProjectSelection from '#lib/components/ProjectSelection.svelte';
	import ProjectRouteBeta from '#lib/components/ProjectRouteBeta.svelte';
	import StyleBadge from '#lib/components/StyleBadge.svelte';
	import TickTypeIcon from '#lib/components/TickTypeIcon.svelte';
	import { formatCalendarDate, formatNumber } from '#lib/dates';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
	const p = $derived(data.project);
	const progress = $derived(data.progress);
	function count(n: number) {
		return formatNumber(n, data.dateDisplay);
	}
	function range(value: [number, number]) {
		return value[0] === value[1] ? count(value[0]) : `${count(value[0])}–${count(value[1])}`;
	}
</script>

<svelte:head><title>{p.routeName} · Projects · Crag Stats</title></svelte:head>

<a class="back" href="/projects">← All projects</a>
<header class="head">
	<p class="eyebrow">{p.status === 'sent' ? 'Sent project' : 'Working on'}</p>
	<h1>
		{p.routeName}{#if p.gradeRaw}
			· {p.gradeRaw}{/if}
	</h1>
	<p class="muted">{p.areaLabel}</p>
	{#if p.gearStyle}<StyleBadge style={p.gearStyle} />{/if}
	{#if p.href}<a href={p.href} target="_blank" rel="noreferrer">View on theCrag ↗</a>{/if}
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
		<h2 id="readiness-title">Project progression</h2>
		<ProjectReadiness pct={progress.pct} horizon={progress.horizon} />
		<p class="totals">
			{count(progress.stats.sessionCount)} sessions · {count(progress.stats.tryCount)} unsuccessful tries
			· {count(progress.stats.sendCount)} sends
		</p>
		{#if progress.support}
			<p class="muted">
				Supporting pyramid in the past 365 days, in this discipline and grade scale: {count(
					progress.support.n1
				)}/2 distinct routes one grade step below; {count(progress.support.n2)}/4 two steps below.
			</p>
		{/if}
		{#if progress.excludedEntries > 0}<p class="muted">
				{count(progress.excludedEntries)} entries with missing, invalid or future dates are excluded from
				progression and estimates.
			</p>{/if}
		<a href="#method">How the estimate works ↓</a>
	</section>
	<section class="panel" aria-labelledby="forecast-title">
		<h2 id="forecast-title">Estimated work remaining</h2>
		{#if progress.forecast}
			{@const forecast = progress.forecast}
			{#if forecast.sessions}<p class="estimate">
					{range(forecast.sessions)} more {forecast.sessions[1] === 1 ? 'session' : 'sessions'}
				</p>{:else}<p>Not enough comparable projects for a session estimate.</p>{/if}
			{#if forecast.tries}<p class="estimate">
					{range(forecast.tries)} more tries, including the send
				</p>{:else}<p>Not enough comparable projects for an attempt estimate.</p>{/if}
			<p class="muted">
				Historical comparison: {count(forecast.sampleCount)} completed outdoor projects in the same discipline
				and scale, within one grade step. Session and attempt estimates need at least three projects that
				took more work than you have logged so far.
			</p>
			<p class="muted">
				This is a rough comparison with completed projects, not a prediction. Unsent projects and
				unlogged tries are absent; a send can come earlier or much later.
			</p>
		{:else}<p>
				This project is sent. The session history below records the work and later repeats.
			</p>{/if}
	</section>
</div>

{#if p.publicBeta}<div class="panel beta"><ProjectRouteBeta beta={p.publicBeta} /></div>{/if}

<section class="panel history" aria-labelledby="sessions-title">
	<h2 id="sessions-title">Session progression</h2>
	<p class="muted">
		Readiness is recalculated using evidence available by each climbing day. Logged effort measures
		practice, not moves completed.
	</p>
	{#if progress.sessions.length}
		<!-- Mobile table overflow must be scrollable with a keyboard. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div class="table-scroll" role="region" aria-label="Session progression table" tabindex="0">
			<table>
				<thead
					><tr
						><th>Climbing day</th><th>Failed tries</th><th>Cumulative failed tries</th><th>Sends</th
						><th>Approximate readiness</th></tr
					></thead
				><tbody>
					{#each progress.sessions as session (session.day)}<tr>
							<td>{formatCalendarDate(session.day, data.dateDisplay)}</td><td
								>{count(session.failedTries)}</td
							><td>{count(session.cumulativeTries)}</td><td>{count(session.sends)}</td><td
								>{session.readiness == null ? 'Unknown grade' : `${count(session.readiness)}%`}</td
							>
						</tr>{/each}
				</tbody>
			</table>
		</div>
	{:else}<p>No valid dated sessions yet.</p>{/if}
</section>

<section class="panel history" aria-labelledby="tries-title">
	<h2 id="tries-title">Previous tries &amp; sends</h2>
	<p class="muted">
		Newest first. Attempt counts on send entries include the successful try and can overlap
		separately logged failures.
	</p>
	<ul class="tries">
		{#each data.attempts as attempt (attempt.id)}
			<li>
				<span
					>{attempt.day
						? formatCalendarDate(attempt.day, data.dateDisplay)
						: 'Unknown climbing day'}</span
				>
				<TickTypeIcon tick={attempt.tickLabel || attempt.tickType} />
				{#if attempt.numberAttempts != null && attempt.numberAttempts > 0}<span
						>{count(attempt.numberAttempts)}
						{attempt.isSend ? 'tries including send' : 'tries logged'}</span
					>{/if}
				{#if attempt.grade}<span>{attempt.grade}</span>{/if}
				{#if attempt.pitchLabel}<span>{attempt.pitchLabel}</span>{/if}
			</li>
		{/each}
	</ul>
</section>

<details id="method" class="panel method">
	<summary>How approximate readiness and estimates work</summary>
	<p>
		Readiness uses the past 365 days of outdoor sends on distinct routes in the same discipline and
		grade scale. A best send at this grade or above contributes 60 points, one step below 35, or two
		steps below 10. Up to 20 points come from two routes one step below, and 25 from four routes two
		steps below.
	</p>
	<p>
		Up to 15 points come from unsuccessful tries on this project, against a soft target of 15
		(short-term), 35 (medium) or 75 (long-haul). The horizon follows the gap to your best recent
		send: at most one step, two steps, or more. The base model caps at 94%. The first session
		establishes the baseline; each additional valid climbing day on this route adds one readiness
		point, up to 99%. Only a logged send reaches 100%. An unknown grade has no readiness estimate.
	</p>
	<p>
		Remaining-work ranges are the middle half of your comparable completed projects, after
		subtracting your logged work. At least three longer projects are required for each range;
		estimates disappear when there is too little evidence or you have exceeded that history. These
		are personal historical comparisons, with no claim of scientific validation.
	</p>
	<p>
		One session is one valid written calendar day. Failed tries use the logged attempt count, or one
		when missing. A send count includes its successful try; its implied failures and separate
		failure entries use the larger total to avoid double counting. Invalid and future dates do not
		contribute to estimates. Private comments are never used.
	</p>
	<a href="/docs/projects">Read the Projects guide →</a>
</details>

<footer class="logbook-link">
	<a href={`/logbook?route=${p.routeId}`}>View all logged climbs on {p.routeName} →</a>
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
