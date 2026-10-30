<script lang="ts">
	import { addDays, averageSessionsPerWeek, type SessionsWeek } from '#lib/sessionsPerWeek';

	type Props = {
		years: string[];
		byYear: Record<string, SessionsWeek[]>;
	};
	let { years, byYear }: Props = $props();

	let selectedYear = $state<string | null>(null);
	const year = $derived(
		selectedYear && years.includes(selectedYear) ? selectedYear : (years[0] ?? '')
	);
	const weeks = $derived(year ? (byYear[year] ?? []) : []);
	const max = $derived(Math.max(1, ...weeks.map((w) => w.sessions)));
	const avg = $derived(averageSessionsPerWeek(weeks));
</script>

<article class="panel">
	<header>
		<div class="titles">
			<h2>Sessions per week</h2>
			<a class="how" href="/docs/sessions-per-week">How it works</a>
		</div>
		{#if years.length > 1}
			<select
				value={year}
				aria-label="Sessions year"
				onchange={(e) => {
					selectedYear = e.currentTarget.value;
				}}
			>
				{#each years as y (y)}
					<option value={y}>{y}</option>
				{/each}
			</select>
		{:else if year}
			<span class="year">{year}</span>
		{/if}
	</header>

	{#if !weeks.length}
		<p class="empty">No dated climbing days yet</p>
	{:else}
		<div class="chart" style:--n={weeks.length} aria-label="Sessions per week in {year}">
			{#each weeks as w (w.weekStart)}
				<a
					class="col"
					href="/logbook?from={encodeURIComponent(w.weekStart)}&to={encodeURIComponent(
						addDays(w.weekStart, 6)
					)}"
					title="Week {w.week} starting {w.weekStart}: {w.sessions} session{w.sessions === 1
						? ''
						: 's'}"
				>
					<span
						class="bar"
						class:empty={w.sessions === 0}
						style:height="{w.sessions === 0 ? 4 : Math.max(8, (w.sessions / max) * 100)}%"
					></span>
				</a>
			{/each}
		</div>
		<p class="avg">Average {avg} sessions / week</p>
		<p class="hint">A session is a calendar day with at least one ascent.</p>
	{/if}
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}
	.titles {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.55rem 0.85rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.how {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--accent);
	}
	select {
		font: inherit;
		padding: 0.25rem 0.45rem;
		border-radius: 0.4rem;
		border: 1px solid var(--line);
		background: var(--paper);
	}
	.year,
	.empty {
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.chart {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		align-items: end;
		gap: 0.12rem;
		height: 9rem;
	}
	.col {
		display: flex;
		align-items: end;
		height: 100%;
		text-decoration: none;
	}
	.bar {
		display: block;
		width: 100%;
		border-radius: 2px 2px 0 0;
		background: var(--accent);
		min-height: 2px;
	}
	.bar.empty {
		background: var(--surface-3);
	}
	.col:hover .bar:not(.empty) {
		background: var(--accent-strong);
	}
	.avg {
		margin: 0.65rem 0 0;
		font-size: 0.9rem;
		font-weight: 600;
	}
	.hint {
		margin: 0.35rem 0 0;
		font-size: 0.78rem;
		color: var(--ink-muted);
	}
</style>
