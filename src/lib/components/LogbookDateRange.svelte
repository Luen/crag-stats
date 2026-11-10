<script lang="ts">
	import { logbookDates } from '#lib/logbookDates';
	let {
		from,
		to,
		years,
		today,
		error
	}: { from: string; to: string; years: string[]; today: string; error: string } = $props();
	let start = $derived(from);
	let end = $derived(to);
	const id = $props.id();
	function preset(event: Event & { currentTarget: HTMLSelectElement }) {
		const value = event.currentTarget.value;
		const dates = logbookDates(
			value === 'ytd' || value === 'last_year'
				? { season: value }
				: { year: Number(value) || undefined },
			today
		);
		start = dates.from;
		end = dates.to;
		event.currentTarget.value = '';
	}
</script>

<div class="date-range">
	<label
		>From (inclusive)<input
			type="date"
			name="from"
			bind:value={start}
			max={end || undefined}
			aria-describedby={`${id}-help`}
			aria-invalid={error ? 'true' : undefined}
		/></label
	>
	<label
		>To (inclusive)<input
			type="date"
			name="to"
			bind:value={end}
			min={start || undefined}
			aria-describedby={`${id}-help`}
			aria-invalid={error ? 'true' : undefined}
		/></label
	>
	<label
		>Fill date range<select aria-label="Fill date range" onchange={preset}>
			<option value="">Choose a preset…</option>
			<option value="all">All dates</option>
			<option value="ytd">Year to date</option>
			<option value="last_year">Last year</option>
			{#each years as year (year)}<option value={year}>Full year {year}</option>{/each}
		</select></label
	>
	<p id={`${id}-help`}>
		Both boundaries include that day. Leave either blank for a one-sided range. Presets fill these
		dates; apply filters to search.
	</p>
	{#if error}<p role="alert">{error}</p>{/if}
</div>

<style>
	.date-range {
		grid-column: 1 / -1;
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
		flex: 1 1 100%;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8rem;
		color: var(--ink-muted);
		flex: 1 1 10rem;
		min-width: 0;
	}
	input,
	select {
		width: 100%;
		min-width: 0;
	}
	p {
		flex-basis: 100%;
		margin: 0;
		font-size: 0.8rem;
		color: var(--ink-muted);
	}
	[role='alert'] {
		color: var(--danger);
	}
</style>
