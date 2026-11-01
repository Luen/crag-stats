<script lang="ts">
	import { DEFAULT_DATE_DISPLAY, formatCalendarDate, type DateDisplay } from '#lib/dates';
	type Props = {
		currentDays: number;
		currentWeeks: number;
		currentMonths: number;
		longestDays: number;
		longestStartDate: string | null;
		longestEndDate: string | null;
		dateDisplay?: DateDisplay;
		lastActiveDate: string | null;
	};
	let {
		currentDays,
		currentWeeks,
		currentMonths,
		longestDays,
		longestStartDate,
		longestEndDate,
		lastActiveDate,
		dateDisplay = DEFAULT_DATE_DISPLAY
	}: Props = $props();
</script>

<article class="panel">
	<h2>Streaks</h2>
	<div class="cards">
		<div class="card">
			<strong>{currentDays}</strong>
			<span>days</span>
		</div>
		<div class="card">
			<strong>{currentWeeks}</strong>
			<span>weeks</span>
		</div>
		<div class="card">
			<strong>{currentMonths}</strong>
			<span>months</span>
		</div>
	</div>
	<p class="foot">
		Longest streak <strong>{longestDays} day{longestDays === 1 ? '' : 's'}</strong>
		{#if lastActiveDate}
			· Last ascent <strong>{formatCalendarDate(lastActiveDate, dateDisplay)}</strong>
		{/if}
	</p>
	{#if longestStartDate && longestEndDate}
		<p class="foot record-range">
			{#if longestStartDate === longestEndDate}On{:else}From{/if}
			<time datetime={longestStartDate}>{formatCalendarDate(longestStartDate, dateDisplay)}</time>
			{#if longestStartDate !== longestEndDate}
				to <time datetime={longestEndDate}>{formatCalendarDate(longestEndDate, dateDisplay)}</time>
			{/if}
		</p>
	{/if}
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.55rem;
	}
	.card {
		border: 1px solid var(--line);
		border-radius: 0.65rem;
		padding: 0.75rem 0.5rem 0.65rem;
		text-align: center;
		background: var(--paper);
		border-top: 3px solid var(--accent-2);
	}
	.card strong {
		display: block;
		font-size: 1.55rem;
		line-height: 1.1;
		font-family: var(--font-display);
	}
	.card span {
		color: var(--ink-muted);
		font-size: 0.8rem;
		text-transform: lowercase;
	}
	.foot {
		margin: 0.7rem 0 0;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
	.foot strong {
		color: var(--ink);
	}
</style>
