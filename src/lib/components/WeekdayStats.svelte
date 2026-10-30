<script lang="ts">
	import { onMount } from 'svelte';
	import BarList from '#lib/components/BarList.svelte';
	import { DEFAULT_DATE_DISPLAY, formatNumber, type DateDisplay } from '#lib/dates';
	import type { WeekdayStatsView } from '#lib/weekdayStats';

	type Range = 'all' | 'last12';

	type Props = {
		data: WeekdayStatsView;
		dateDisplay?: DateDisplay;
	};

	let { data, dateDisplay = DEFAULT_DATE_DISPLAY }: Props = $props();

	const RANGE_KEY = 'cs_weekday_range';
	let range = $state<Range>('all');

	onMount(() => {
		try {
			const v = localStorage.getItem(RANGE_KEY);
			if (v === 'last12' || v === 'all') range = v;
		} catch {
			/* ignore */
		}
	});

	function setRange(next: Range) {
		range = next;
		try {
			localStorage.setItem(RANGE_KEY, next);
		} catch {
			/* ignore */
		}
	}

	const rows = $derived(range === 'last12' ? data.last12Weeks : data.allTime);
	const most = $derived(range === 'last12' ? data.mostActiveLast12 : data.mostActiveAllTime);
	const totalSessions = $derived(
		range === 'last12' ? data.totalSessionsLast12 : data.totalSessionsAllTime
	);

	const items = $derived(
		rows.map((r) => ({
			id: `dow:${r.weekday}`,
			label: r.label,
			value: r.sessions,
			meta: `${formatNumber(r.ascents, dateDisplay)} ascent${r.ascents === 1 ? '' : 's'}`,
			color: most && r.weekday === most.weekday ? 'var(--accent)' : 'var(--accent-2)'
		}))
	);
</script>

<article class="panel">
	<header>
		<div class="titles">
			<h2>Weekday</h2>
			<a class="how" href="/docs/weekday">How it works</a>
		</div>
		<div class="toggles" role="group" aria-label="Weekday range">
			<button
				type="button"
				class={{ active: range === 'all' }}
				aria-pressed={range === 'all'}
				onclick={() => setRange('all')}>All time</button
			>
			<button
				type="button"
				class={{ active: range === 'last12' }}
				aria-pressed={range === 'last12'}
				onclick={() => setRange('last12')}>Last 12 weeks</button
			>
		</div>
	</header>

	{#if totalSessions === 0}
		<p class="empty">
			{range === 'last12'
				? 'No climbing days in the last 12 weeks.'
				: 'No dated climbing days yet.'}
		</p>
	{:else}
		{#if most}
			<p class="lead">
				Your most active day is <strong>{most.label}</strong>
				({formatNumber(most.sessions, dateDisplay)} session{most.sessions === 1 ? '' : 's'}).
			</p>
		{/if}
		<BarList {items} maxBars={7} />
		<p class="hint">
			A session is a calendar day with at least one ascent · {formatNumber(
				totalSessions,
				dateDisplay
			)} session{totalSessions === 1 ? '' : 's'} in this range.
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
		align-items: center;
		gap: 0.65rem 1rem;
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
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
	}
	.lead {
		margin: 0 0 0.85rem;
		font-size: 0.92rem;
		color: var(--ink-muted);
	}
	.lead strong {
		color: var(--ink);
		font-weight: 700;
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
