<script lang="ts">
	type Axis = { key: string; label: string; last30: number; last90: number };
	type Props = { axes: Axis[] };
	let { axes }: Props = $props();

	const size = 220;
	const pad = 38;
	const cx = size / 2;
	const cy = size / 2;
	const radius = 72;
	const labelRadius = radius + 16;

	function axisAngle(i: number, n: number) {
		return -Math.PI / 2 + (i / n) * Math.PI * 2;
	}

	function point(i: number, n: number, value: number) {
		const angle = axisAngle(i, n);
		const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
		return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
	}

	function labelPoint(i: number, n: number) {
		const angle = axisAngle(i, n);
		const x = cx + Math.cos(angle) * labelRadius;
		const y = cy + Math.sin(angle) * labelRadius;
		return { x, y };
	}

	function poly(values: number[]) {
		return values
			.map((v, i) => {
				const [x, y] = point(i, values.length, v);
				return `${x},${y}`;
			})
			.join(' ');
	}

	const rings = [0.2, 0.4, 0.6, 0.8, 1];
	const last90 = $derived(axes.map((a) => a.last90));
	const last30 = $derived(axes.map((a) => a.last30));
</script>

<article class="panel">
	<header>
		<h2>Climber profile</h2>
		<div class="legend">
			<span class="l90">last 90 days</span>
			<span class="l30">last 30 days</span>
		</div>
	</header>
	{#if axes.length}
		<svg
			viewBox="{-pad} {-pad} {size + pad * 2} {size + pad * 2}"
			class="radar"
			role="img"
			aria-label="Climber profile radar"
		>
			{#each rings as ring (ring)}
				<polygon
					class="ring"
					points={poly(axes.map(() => ring * 100))}
				/>
			{/each}
			{#each axes as axis, i (axis.key)}
				{@const [x, y] = point(i, axes.length, 100)}
				{@const lp = labelPoint(i, axes.length)}
				<line class="spoke" x1={cx} y1={cy} x2={x} y2={y} />
				<text
					class="label"
					x={lp.x}
					y={lp.y}
					dy={lp.y < cy - 2 ? '-0.2em' : lp.y > cy + 2 ? '0.75em' : '0.35em'}
					text-anchor={lp.x < cx - 6 ? 'end' : lp.x > cx + 6 ? 'start' : 'middle'}>{axis.label}</text
				>
			{/each}
			<polygon class="fill90" points={poly(last90)} />
			<polygon class="fill30" points={poly(last30)} />
		</svg>
	{:else}
		<p class="empty">Not enough recent ascents</p>
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
		gap: 0.75rem;
		align-items: baseline;
		margin-bottom: 0.35rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.legend {
		display: flex;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: var(--ink-muted);
	}
	.l90::before,
	.l30::before {
		content: '';
		display: inline-block;
		width: 0.65rem;
		height: 0.65rem;
		margin-right: 0.25rem;
		border-radius: 2px;
		vertical-align: -1px;
	}
	.l90::before {
		background: #2a9d8f;
	}
	.l30::before {
		background: #1d6fa5;
	}
	.radar {
		width: 100%;
		max-width: 280px;
		margin: 0 auto;
		display: block;
		overflow: visible;
	}
	.ring {
		fill: none;
		stroke: var(--line);
		stroke-width: 1;
	}
	.spoke {
		stroke: var(--line);
		stroke-width: 1;
	}
	.label {
		font-size: 9px;
		fill: var(--ink-muted);
	}
	.fill90 {
		fill: rgba(42, 157, 143, 0.22);
		stroke: #2a9d8f;
		stroke-width: 2;
	}
	.fill30 {
		fill: rgba(29, 111, 165, 0.18);
		stroke: #1d6fa5;
		stroke-width: 2;
	}
	.empty {
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
</style>
