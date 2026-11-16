<script lang="ts">
	import { DEFAULT_DATE_DISPLAY, formatCalendarDate, type DateDisplay } from '#lib/dates';
	import { useI18n } from '#lib/i18n';
	type Props = {
		currentDays: number;
		currentWeeks: number;
		currentMonths: number;
		longestDays: number;
		longestStartDate: string | null;
		longestEndDate: string | null;
		dateDisplay?: DateDisplay;
		lastActiveDate: string | null;
		activeDays: number;
		daysSinceLastActive: number | null;
	};
	let {
		currentDays,
		currentWeeks,
		currentMonths,
		longestDays,
		longestStartDate,
		longestEndDate,
		lastActiveDate,
		activeDays,
		daysSinceLastActive,
		dateDisplay = DEFAULT_DATE_DISPLAY
	}: Props = $props();
	const i18n = useI18n();
</script>

<article class="panel">
	<header>
		<h2>{i18n.t('cards.streaks.titleStreaks')}</h2>
		<a class="how" href="/docs/activity">{i18n.t('common.howItWorks')}</a>
	</header>
	<div class="cards">
		<div class="card">
			<strong>{currentDays}</strong>
			<span>{i18n.t('cards.streaks.days')}</span>
		</div>
		<div class="card">
			<strong>{currentWeeks}</strong>
			<span>{i18n.t('cards.streaks.weeks')}</span>
		</div>
		<div class="card">
			<strong>{currentMonths}</strong>
			<span>{i18n.t('cards.streaks.months')}</span>
		</div>
		<div class="card">
			<strong>{longestDays}</strong>
			<span>{i18n.t('cards.streaks.longest')}</span>
		</div>
	</div>
	{#if longestStartDate && longestEndDate}
		<p class="foot record-range">
			{#if longestStartDate === longestEndDate}{i18n.t('common.on')}{:else}{i18n.t(
					'common.from'
				)}{/if}
			<time datetime={longestStartDate}>{formatCalendarDate(longestStartDate, dateDisplay)}</time>
			{#if longestStartDate !== longestEndDate}
				{i18n.t('common.to')}
				<time datetime={longestEndDate}>{formatCalendarDate(longestEndDate, dateDisplay)}</time>
			{/if}
		</p>
	{/if}
	<p class="foot">
		{#if lastActiveDate}
			{i18n.t('cards.streaks.lastAscent')}
			<strong>{formatCalendarDate(lastActiveDate, dateDisplay)}</strong>
			{#if daysSinceLastActive != null}
				· <strong>{daysSinceLastActive}</strong>
				{i18n.t('common.days', { count: daysSinceLastActive })}
				{i18n.t('common.since')}
			{/if}
			·
		{/if}
		<strong>{activeDays}</strong>
		{i18n.t('common.activeDays', { count: activeDays })}
	</p>
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
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
