<script lang="ts">
	import { MONTH_LABELS } from '#lib/bestMonths';
	let { values, month, name }: { values: number[]; month: number; name: string } = $props();
	const peak = $derived(Math.max(0, ...values) || 1);
</script>

<div class="strip" aria-hidden="true">
	{#each MONTH_LABELS as label, i (label)}
		<div class="month" class:selected={i === month - 1}>
			<span class="bar" style:height={`${Math.max(2, (values[i] / peak) * 32)}px`}></span>
			<span>{label}</span>
		</div>
	{/each}
</div>
<details>
	<summary>Monthly values for {name}</summary>
	<table>
		<caption>{name}: theCrag seasonality</caption>
		<thead><tr><th scope="col">Month</th><th scope="col">Value</th></tr></thead>
		<tbody
			>{#each MONTH_LABELS as label, i (label)}
				<tr
					><th scope="row">{label}{i === month - 1 ? ' (selected)' : ''}</th><td
						>{values[i].toFixed(1)}</td
					></tr
				>
			{/each}</tbody
		>
	</table>
</details>

<style>
	.strip {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 0.15rem;
		margin: 1rem 0 0.65rem;
	}
	.month {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		align-items: center;
		min-width: 0;
		gap: 0.3rem;
		padding: 0.2rem 0;
		font-size: 0.65rem;
		color: var(--ink-muted);
		border-bottom: 2px solid transparent;
	}
	.selected {
		border-color: var(--accent);
		color: var(--ink);
		font-weight: 700;
	}
	.bar {
		background: var(--accent);
		width: 65%;
		border-radius: 2px 2px 0 0;
	}
	details {
		font-size: 0.82rem;
	}
	summary {
		cursor: pointer;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 0.5rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.3rem;
		border-bottom: 1px solid var(--line);
	}
	caption {
		text-align: left;
		font-weight: 600;
	}
</style>
