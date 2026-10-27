<script lang="ts">
	type Point = {
		stars: number;
		score: number;
		routeName: string;
		url: string | null;
	};

	type Props = { points: Point[] };
	let { points }: Props = $props();

	const pad = { l: 36, r: 12, t: 12, b: 28 };
	const w = 320;
	const h = 180;
	const innerW = w - pad.l - pad.r;
	const innerH = h - pad.t - pad.b;

	const scoreMin = $derived(points.length ? Math.min(...points.map((p) => p.score)) : 0);
	const scoreMax = $derived(
		points.length ? Math.max(scoreMin + 1, ...points.map((p) => p.score)) : 1
	);

	function xOf(score: number): number {
		return pad.l + ((score - scoreMin) / (scoreMax - scoreMin)) * innerW;
	}

	function yOf(stars: number): number {
		const clamped = Math.max(0, Math.min(3, stars));
		return pad.t + (1 - clamped / 3) * innerH;
	}
</script>

<article class="panel">
	<h2>Stars vs grade</h2>

	{#if points.length === 0}
		<p class="empty">No rated routes yet.</p>
	{:else}
		<svg viewBox="0 0 {w} {h}" role="img" aria-label="Scatter of route stars versus grade score">
			<!-- axes -->
			<line x1={pad.l} y1={pad.t} x2={pad.l} y2={h - pad.b} stroke="var(--line)" stroke-width="1" />
			<line
				x1={pad.l}
				y1={h - pad.b}
				x2={w - pad.r}
				y2={h - pad.b}
				stroke="var(--line)"
				stroke-width="1"
			/>
			{#each [0, 1, 2, 3] as star (star)}
				<text x={pad.l - 8} y={yOf(star) + 3} text-anchor="end" class="axis">{star}★</text>
			{/each}
			<text x={pad.l} y={h - 6} class="axis">Grade →</text>
			<text x={w - pad.r} y={h - 6} text-anchor="end" class="axis">{Math.round(scoreMax)}</text>

			{#each points as p, i (`${p.routeName}-${p.score}-${p.stars}-${i}`)}
				{#if p.url}
					<a href={p.url} target="_blank" rel="noreferrer">
						<circle cx={xOf(p.score)} cy={yOf(p.stars)} r="4.5" fill="var(--accent)" opacity="0.75">
							<title>{p.routeName}: {p.stars}★ · score {p.score}</title>
						</circle>
					</a>
				{:else}
					<circle cx={xOf(p.score)} cy={yOf(p.stars)} r="4.5" fill="var(--accent)" opacity="0.75">
						<title>{p.routeName}: {p.stars}★ · score {p.score}</title>
					</circle>
				{/if}
			{/each}
		</svg>
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
	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	.axis {
		fill: var(--ink-muted);
		font-size: 10px;
	}
	circle:hover {
		opacity: 1;
	}
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
</style>
