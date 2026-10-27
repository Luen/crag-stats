<script lang="ts">
	import { formatVScaleLabel } from '#lib/grades';

	type Point = {
		stars: number;
		score: number;
		kind: 'route' | 'boulder';
		routeName: string;
		url: string | null;
	};

	type Props = { points: Point[] };
	let { points }: Props = $props();

	type Kind = Point['kind'];

	// Route scores are Ewbanks and boulder scores V-grades, so they get separate views;
	// on one axis V3 lands beside grade 3. Start on whichever the logbook has more of.
	const counts = $derived({
		route: points.filter((p) => p.kind === 'route').length,
		boulder: points.filter((p) => p.kind === 'boulder').length
	});
	let kindOverride = $state<Kind | null>(null);
	const kind = $derived<Kind>(
		kindOverride ?? (counts.boulder > counts.route ? 'boulder' : 'route')
	);
	const shown = $derived(points.filter((p) => p.kind === kind));

	const pad = { l: 34, r: 14, t: 14, b: 30 };
	const w = 480;
	const h = 200;
	const innerW = w - pad.l - pad.r;
	const innerH = h - pad.t - pad.b;

	// Many sends share a grade and a star rating, and identical dots drew a solid bar.
	// One bubble per (grade, stars), sized by how many sends it holds.
	type Bubble = { score: number; stars: number; names: string[]; url: string | null };
	const bubbles = $derived.by(() => {
		// Scratch map, rebuilt on every derive; nothing subscribes to it.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const map = new Map<string, Bubble>();
		for (const p of shown) {
			const score = Math.round(p.score);
			const stars = Math.max(0, Math.min(3, Math.round(p.stars)));
			const key = `${score}|${stars}`;
			const b = map.get(key) ?? { score, stars, names: [], url: p.url };
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

	const ticks = $derived.by(() => {
		const span = scoreMax - scoreMin;
		const step = span <= 8 ? 1 : span <= 16 ? 2 : span <= 30 ? 4 : 5;
		const out: number[] = [];
		for (let s = Math.ceil(scoreMin / step) * step; s <= scoreMax; s += step) out.push(s);
		return out;
	});

	// Mean stars per grade: does climbing harder mean climbing better routes? A grade with
	// one or two sends swings the line from 0★ to 3★, so it only joins with TREND_MIN_SENDS.
	const TREND_MIN_SENDS = 3;
	const trend = $derived.by(() => {
		// Scratch map, rebuilt on every derive; nothing subscribes to it.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const byScore = new Map<number, { sum: number; n: number }>();
		for (const b of bubbles) {
			const agg = byScore.get(b.score) ?? { sum: 0, n: 0 };
			agg.sum += b.stars * b.names.length;
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
	const meanStars = $derived(
		shown.length ? shown.reduce((s, p) => s + p.stars, 0) / shown.length : 0
	);

	function xOf(score: number): number {
		return pad.l + ((score - scoreMin) / (scoreMax - scoreMin)) * innerW;
	}

	function yOf(stars: number): number {
		const clamped = Math.max(0, Math.min(3, stars));
		return pad.t + (1 - clamped / 3) * innerH;
	}

	function radius(count: number): number {
		return 3 + 7 * Math.sqrt(count / maxCount);
	}

	function gradeLabel(score: number): string {
		return kind === 'boulder' ? formatVScaleLabel(score) : String(score);
	}

	function describe(b: Bubble): string {
		const n = b.names.length;
		const head = `${gradeLabel(b.score)} · ${b.stars}★ · ${n} send${n === 1 ? '' : 's'}`;
		const more = n > 5 ? ` +${n - 5} more` : '';
		return `${head}\n${b.names.slice(0, 5).join(', ')}${more}`;
	}
</script>

<article class="panel">
	<header>
		<h2>Stars vs grade</h2>
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
		<p class="summary">{shown.length} rated sends · average {meanStars.toFixed(1)}★</p>
		<svg
			viewBox="0 0 {w} {h}"
			role="group"
			aria-label="Sends by grade and star rating; larger bubbles hold more sends"
		>
			{#each [0, 1, 2, 3] as star (star)}
				<line
					x1={pad.l}
					y1={yOf(star)}
					x2={w - pad.r}
					y2={yOf(star)}
					class={star === 0 ? 'axis-line' : 'grid'}
				/>
				<text x={pad.l - 8} y={yOf(star) + 4} text-anchor="end" class="axis">{star}★</text>
			{/each}
			{#each ticks as t (t)}
				<text x={xOf(t)} y={h - pad.b + 16} text-anchor="middle" class="axis">{gradeLabel(t)}</text>
			{/each}

			{#if trendPath}
				<path d={trendPath} class="trend" />
			{/if}

			{#each bubbles as b (`${b.score}|${b.stars}`)}
				{#if b.names.length === 1 && b.url}
					<a href={b.url} target="_blank" rel="noreferrer">
						<circle cx={xOf(b.score)} cy={yOf(b.stars)} r={radius(1)} class="dot">
							<title>{describe(b)}</title>
						</circle>
					</a>
				{:else}
					<circle cx={xOf(b.score)} cy={yOf(b.stars)} r={radius(b.names.length)} class="dot">
						<title>{describe(b)}</title>
					</circle>
				{/if}
			{/each}
		</svg>
		<p class="legend">
			<span class="swatch dot-swatch"></span> bubble size = sends
			<span class="swatch trend-swatch"></span> average stars per grade ({TREND_MIN_SENDS}+ sends)
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
