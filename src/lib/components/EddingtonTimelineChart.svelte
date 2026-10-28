<script lang="ts">
	import type { EddingtonTimelinePoint } from '#lib/types/dashboard';

	type Props = { timeline: EddingtonTimelinePoint[] };
	let { timeline }: Props = $props();

	type SeriesKey = 'sendsE' | 'verticalE' | 'routeE' | 'boulderE';

	const SERIES: { key: SeriesKey; label: string; color: string }[] = [
		{ key: 'sendsE', label: 'Send days', color: 'var(--accent)' },
		{ key: 'verticalE', label: 'Vertical days', color: 'var(--style-trad)' },
		{ key: 'routeE', label: 'Route grade', color: 'var(--style-sport)' },
		{ key: 'boulderE', label: 'Boulder grade', color: 'var(--style-boulder)' }
	];

	let active = $state<SeriesKey>('sendsE');

	const series = $derived(SERIES.find((s) => s.key === active)!);

	const points = $derived(
		timeline.map((p, i) => ({
			i,
			period: p.period,
			value: p[active]
		}))
	);

	const maxY = $derived(Math.max(1, ...points.map((p) => p.value)));

	const n = $derived(points.length);
	const xPct = (i: number) => ((i + 0.5) / Math.max(1, n)) * 100;
	const yPct = (v: number) => 100 - (v / maxY) * 92;

	const linePath = $derived.by(() => {
		if (points.length < 2) return '';
		return points
			.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${xPct(p.i)},${yPct(p.value)}`)
			.join(' ');
	});

	const areaPath = $derived(
		linePath && points.length >= 2
			? `${linePath} L${xPct(points[points.length - 1].i)},100 L${xPct(points[0].i)},100 Z`
			: ''
	);

	const sparseLabels = $derived(points.length > 12);
</script>

<article class="panel">
	<div class="head">
		<h2>Eddington over time</h2>
		<div class="toggles" role="group" aria-label="Metric">
			{#each SERIES as s (s.key)}
				<button
					type="button"
					class={{ active: active === s.key }}
					aria-pressed={active === s.key}
					onclick={() => (active = s.key)}>{s.label}</button
				>
			{/each}
		</div>
	</div>

	{#if timeline.length === 0}
		<p class="empty">No dated ascents yet — sync or import your logbook to see growth.</p>
	{:else if points.length === 1}
		<p class="single">
			{series.label} E is <strong>{points[0].value}</strong> as of {points[0].period}.
		</p>
	{:else}
		<div class="chart-wrap">
			<svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img">
				<title>{series.label} Eddington number by year</title>
				{#if areaPath}
					<path class="area" d={areaPath} style:fill={series.color} />
				{/if}
				{#if linePath}
					<path
						class="line"
						d={linePath}
						style:stroke={series.color}
						vector-effect="non-scaling-stroke"
					/>
				{/if}
				{#each points as p (p.period)}
					<circle class="dot" cx={xPct(p.i)} cy={yPct(p.value)} r="1.2" style:fill={series.color}
						><title>{p.period}: {p.value}</title></circle
					>
				{/each}
			</svg>
			<div class="axis">
				{#each points as p, i (p.period)}
					{#if !sparseLabels || i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 6) === 0}
						<span style:left="{xPct(i)}%">{p.period}</span>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
	{#if points.length > 1}
		<details class="values">
			<summary>View yearly values</summary>
			<table>
				<caption>{series.label} Eddington number by year</caption><thead
					><tr><th scope="col">Year</th><th scope="col">Eddington number</th></tr></thead
				><tbody>
					{#each points as p (p.period)}<tr><th scope="row">{p.period}</th><td>{p.value}</td></tr
						>{/each}
				</tbody>
			</table>
		</details>
	{/if}
</article>

<style>
	.values {
		margin-top: 0.75rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		text-align: left;
		padding: 0.35rem 0.5rem;
		border-bottom: 1px solid var(--line);
	}
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
		max-width: 100%;
		min-width: 0;
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem 1rem;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.75rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.toggles {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.toggles button {
		font: inherit;
		font-size: 0.78rem;
		padding: 0.28rem 0.55rem;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		background: var(--paper);
		color: var(--ink-muted);
		cursor: pointer;
	}
	.toggles button.active {
		background: color-mix(in srgb, var(--accent) 12%, var(--paper));
		border-color: var(--accent);
		color: var(--ink);
	}
	.chart-wrap {
		position: relative;
		height: 200px;
	}
	svg {
		display: block;
		width: 100%;
		height: calc(100% - 1.4rem);
		overflow: visible;
	}
	.area {
		opacity: 0.18;
	}
	.line {
		fill: none;
		stroke-width: 2.5;
	}
	.dot {
		vector-effect: non-scaling-stroke;
	}
	.axis {
		position: relative;
		height: 1.25rem;
		margin-top: 0.15rem;
		font-size: 0.72rem;
		color: var(--ink-muted);
	}
	.axis span {
		position: absolute;
		transform: translateX(-50%);
		white-space: nowrap;
	}
	.empty,
	.single {
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.single strong {
		color: var(--ink);
		font-family: var(--font-display);
	}
</style>
