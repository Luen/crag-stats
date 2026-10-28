<script lang="ts">
	import { formatVScaleLabel } from '#lib/grades';
	import { scatterQualityY } from '#lib/qualityScore';

	type Point = {
		stars: number | null;
		qualityScore: number | null;
		score: number;
		kind: 'route' | 'boulder';
		routeName: string;
		url: string | null;
	};

	type Props = { points: Point[] };
	let { points }: Props = $props();

	type Kind = Point['kind'];

	const counts = $derived({
		route: points.filter((p) => p.kind === 'route').length,
		boulder: points.filter((p) => p.kind === 'boulder').length
	});
	let kindOverride = $state<Kind | null>(null);
	const kind = $derived<Kind>(
		kindOverride ?? (counts.boulder > counts.route ? 'boulder' : 'route')
	);
	const shown = $derived(points.filter((p) => p.kind === kind));

	const useQualityAxis = $derived(
		shown.some((p) => p.qualityScore != null && Number.isFinite(p.qualityScore))
	);

	const pad = { l: 34, r: 14, t: 14, b: 30 };
	const w = 480;
	const h = 200;
	const innerW = w - pad.l - pad.r;
	const innerH = h - pad.t - pad.b;

	function qualityY(p: Point): number {
		return scatterQualityY(p.stars, p.qualityScore) ?? 0;
	}

	type Bubble = {
		score: number;
		y: number;
		stars: number | null;
		qualityScore: number | null;
		names: string[];
		url: string | null;
	};
	const bubbles = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const map = new Map<string, Bubble>();
		for (const p of shown) {
			const score = Math.round(p.score);
			const y = useQualityAxis
				? Math.round(qualityY(p))
				: Math.max(0, Math.min(3, Math.round(p.stars ?? 0)));
			const key = `${score}|${y}|${useQualityAxis ? 'q' : 's'}`;
			const b = map.get(key) ?? {
				score,
				y,
				stars: p.stars,
				qualityScore: p.qualityScore,
				names: [],
				url: p.url
			};
			b.names.push(p.routeName);
			map.set(key, b);
		}
		return [...map.values()];
	});
	const maxCount = $derived(Math.max(1, ...bubbles.map((b) => b.names.length)));

	const scoreMin = $derived(bubbles.length ? Math.min(...bubbles.map((b) => b.score)) : 0);
	const scoreMax = $derived(
		bubbles.length ? Math.max(scoreMin + 1, ...bubbles.map((b) => b.score)) : 1
	);

	const xTicks = $derived.by(() => {
		const span = scoreMax - scoreMin;
		const step = span <= 8 ? 1 : span <= 16 ? 2 : span <= 30 ? 4 : 5;
		const out: number[] = [];
		for (let s = Math.ceil(scoreMin / step) * step; s <= scoreMax; s += step) out.push(s);
		return out;
	});

	const yTicks = $derived(useQualityAxis ? [0, 25, 50, 75, 100] : [0, 1, 2, 3]);

	const TREND_MIN_SENDS = 3;
	const trend = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const byScore = new Map<number, { sum: number; n: number }>();
		for (const b of bubbles) {
			const agg = byScore.get(b.score) ?? { sum: 0, n: 0 };
			agg.sum += b.y * b.names.length;
			agg.n += b.names.length;
			byScore.set(b.score, agg);
		}
		return [...byScore.entries()]
			.filter(([, v]) => v.n >= TREND_MIN_SENDS)
			.sort((a, b) => a[0] - b[0])
			.map(([score, v]) => ({ score, mean: v.sum / v.n }));
	});
	const trendPath = $derived(
		trend.length > 1
			? trend.map((t, i) => `${i ? 'L' : 'M'}${xOf(t.score)},${yOf(t.mean)}`).join(' ')
			: ''
	);
	const meanQuality = $derived(
		shown.length ? shown.reduce((s, p) => s + qualityY(p), 0) / shown.length : 0
	);
	const meanStars = $derived(
		shown.filter((p) => p.stars != null).length
			? shown.reduce((s, p) => s + (p.stars ?? 0), 0) / shown.filter((p) => p.stars != null).length
			: 0
	);

	function xOf(score: number): number {
		return pad.l + ((score - scoreMin) / (scoreMax - scoreMin)) * innerW;
	}

	function yOf(value: number): number {
		if (useQualityAxis) {
			const clamped = Math.max(0, Math.min(100, value));
			return pad.t + (1 - clamped / 100) * innerH;
		}
		const clamped = Math.max(0, Math.min(3, value));
		return pad.t + (1 - clamped / 3) * innerH;
	}

	function radius(count: number): number {
		return 3 + 7 * Math.sqrt(count / maxCount);
	}

	function gradeLabel(score: number): string {
		return kind === 'boulder' ? formatVScaleLabel(score) : String(score);
	}

	function yTickLabel(t: number): string {
		return useQualityAxis ? String(t) : `${t}★`;
	}

	function describe(b: Bubble): string {
		const n = b.names.length;
		const qualityPart = useQualityAxis
			? b.qualityScore != null
				? `${Math.round(b.qualityScore)} quality`
				: b.stars != null
					? `${b.stars}★ (est.)`
					: `${b.y} quality`
			: `${b.y}★`;
		const head = `${gradeLabel(b.score)} · ${qualityPart} · ${n} send${n === 1 ? '' : 's'}`;
		const more = n > 5 ? ` +${n - 5} more` : '';
		return `${head}\n${b.names.slice(0, 5).join(', ')}${more}`;
	}
</script>

<article class="panel">
	<header>
		<h2>{useQualityAxis ? 'Quality vs grade' : 'Stars vs grade'}</h2>
		{#if counts.route && counts.boulder}
			<div class="toggles" role="group" aria-label="Climb type">
				<button
					type="button"
					class={{ active: kind === 'route' }}
					aria-pressed={kind === 'route'}
					onclick={() => (kindOverride = 'route')}>Routes</button
				>
				<button
					type="button"
					class={{ active: kind === 'boulder' }}
					aria-pressed={kind === 'boulder'}
					onclick={() => (kindOverride = 'boulder')}>Boulders</button
				>
			</div>
		{/if}
	</header>

	{#if shown.length === 0}
		<p class="empty">No rated routes yet.</p>
	{:else}
		<p class="summary">
			{shown.length} rated sends ·
			{#if useQualityAxis}
				average {Math.round(meanQuality)} quality
				{#if meanStars > 0}
					<span class="muted"> ({meanStars.toFixed(1)}★ where no score)</span>
				{/if}
			{:else}
				average {meanStars.toFixed(1)}★
			{/if}
		</p>
		<svg
			viewBox="0 0 {w} {h}"
			role="group"
			aria-label={useQualityAxis
				? 'Sends by grade and theCrag quality score; larger bubbles hold more sends'
				: 'Sends by grade and star rating; larger bubbles hold more sends'}
		>
			{#each yTicks as tick (tick)}
				<line
					x1={pad.l}
					y1={yOf(tick)}
					x2={w - pad.r}
					y2={yOf(tick)}
					class={tick === 0 ? 'axis-line' : 'grid'}
				/>
				<text x={pad.l - 8} y={yOf(tick) + 4} text-anchor="end" class="axis"
					>{yTickLabel(tick)}</text
				>
			{/each}
			{#each xTicks as t (t)}
				<text x={xOf(t)} y={h - pad.b + 16} text-anchor="middle" class="axis">{gradeLabel(t)}</text>
			{/each}

			{#if trendPath}
				<path d={trendPath} class="trend" />
			{/if}

			{#each bubbles as b (`${b.score}|${b.y}|${b.names.length}`)}
				{#if b.names.length === 1 && b.url}
					<a href={b.url} target="_blank" rel="noreferrer">
						<circle cx={xOf(b.score)} cy={yOf(b.y)} r={radius(1)} class="dot">
							<title>{describe(b)}</title>
						</circle>
					</a>
				{:else}
					<circle cx={xOf(b.score)} cy={yOf(b.y)} r={radius(b.names.length)} class="dot">
						<title>{describe(b)}</title>
					</circle>
				{/if}
			{/each}
		</svg>
		<p class="legend">
			<span class="swatch dot-swatch"></span> bubble size = sends
			<span class="swatch trend-swatch"></span>
			{useQualityAxis ? 'average quality per grade' : 'average stars per grade'} ({TREND_MIN_SENDS}+
			sends)
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
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		margin-bottom: 0.35rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.toggles {
		display: flex;
		gap: 0.35rem;
	}
	.toggles button {
		font: inherit;
		font-size: 0.8rem;
		padding: 0.25rem 0.6rem;
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
	.summary,
	.legend {
		margin: 0 0 0.5rem;
		font-size: 0.8rem;
		color: var(--ink-muted);
	}
	.summary .muted {
		opacity: 0.85;
	}
	.legend {
		margin: 0.35rem 0 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
	}
	.swatch {
		display: inline-block;
		width: 0.7rem;
		height: 0.7rem;
	}
	.dot-swatch {
		border-radius: 50%;
		background: var(--accent);
		opacity: 0.55;
	}
	.trend-swatch {
		margin-left: 0.6rem;
		width: 1rem;
		height: 2px;
		background: var(--ink-muted);
	}
	svg {
		width: 100%;
		height: auto;
		display: block;
	}
	.axis {
		fill: var(--ink-muted);
		font-size: 11px;
	}
	.grid {
		stroke: var(--line);
		stroke-width: 1;
		stroke-dasharray: 2 4;
	}
	.axis-line {
		stroke: var(--line);
		stroke-width: 1;
	}
	.dot {
		fill: var(--accent);
		fill-opacity: 0.55;
		stroke: var(--accent);
		stroke-width: 1;
	}
	.dot:hover {
		fill-opacity: 0.9;
	}
	.trend {
		fill: none;
		stroke: var(--ink-muted);
		stroke-width: 1.5;
		stroke-linejoin: round;
	}
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
</style>
