<script lang="ts">
	import { formatVScaleLabel, GRADE_BANDS } from '#lib/grades';
	import { styleBadgeColor } from '#lib/ticks';
	import type { CprTimelineData } from '#lib/types/dashboard';

	type Props = { title: string; data: CprTimelineData; gradeMin?: number; gradeMax?: number };
	let { title, data, gradeMin, gradeMax }: Props = $props();
	const titleColor = $derived(styleBadgeColor(title));
	/** Boulder scores are V-grades; sport/trad are Ewbanks. */
	const isBoulder = $derived(title.toLowerCase().includes('boulder'));

	const range = $derived.by(() => {
		const vals: number[] = [];
		for (const b of data.buckets) {
			for (const c of b.candles) {
				if (Number.isFinite(c.min)) vals.push(c.min);
				if (Number.isFinite(c.max)) vals.push(c.max);
			}
			if (b.cprGrade != null && Number.isFinite(b.cprGrade)) vals.push(b.cprGrade);
		}
		if (!vals.length) return { min: gradeMin ?? 0, max: gradeMax ?? 10 };
		const min = gradeMin ?? Math.floor(Math.min(...vals) - 1);
		const max = gradeMax ?? Math.ceil(Math.max(...vals) + 1);
		if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 10 };
		return { min, max: Math.max(min + 1, max) };
	});

	/** 0 (top) … 100 (bottom) */
	function y(score: number): number {
		if (!Number.isFinite(score)) return 50;
		const span = range.max - range.min;
		if (span <= 0) return 50;
		return Math.min(100, Math.max(0, ((range.max - score) / span) * 100));
	}

	const gradeLabel = (g: number) => (isBoulder ? formatVScaleLabel(g) : String(Math.round(g)));

	/** Background bands at the real theCrag band boundaries, clipped to the visible range. */
	const bands = $derived.by(() => {
		const edges: [number, number][] = isBoulder
			? [
					[-Infinity, -0.4],
					[-0.4, 0.99],
					[0.99, 4.5],
					[4.5, 10.5],
					[10.5, Infinity]
				]
			: GRADE_BANDS.map((b, i) => [
					i === 0 ? -Infinity : b.ewbankMin - 0.5,
					i === GRADE_BANDS.length - 1 ? Infinity : b.ewbankMax + 0.5
				]);
		const out: { name: string; id: number; top: number; height: number }[] = [];
		GRADE_BANDS.forEach((band, i) => {
			const lo = Math.max(edges[i][0], range.min);
			const hi = Math.min(edges[i][1], range.max);
			if (hi > lo) out.push({ name: band.name, id: band.id, top: y(hi), height: y(lo) - y(hi) });
		});
		return out;
	});

	/** At most ~6 ticks on whole grades. */
	const ticks = $derived.by(() => {
		const step = Math.max(1, Math.ceil((range.max - range.min) / 5));
		const out: number[] = [];
		for (let g = Math.ceil(range.min); g <= range.max; g += step) out.push(g);
		return out;
	});

	const n = $derived(data.buckets.length);
	const xPct = (i: number) => ((i + 0.5) / Math.max(1, n)) * 100;

	const points = $derived.by(() => {
		const out: { i: number; g: number }[] = [];
		data.buckets.forEach((b, i) => {
			if (b.cprGrade != null && Number.isFinite(b.cprGrade)) out.push({ i, g: b.cprGrade });
		});
		return out;
	});

	/**
	 * Smooth monotone cubic curve (Fritsch–Carlson) through the CPR points, in the SVG's
	 * 0..100 viewBox. Monotone so the curve never overshoots a real data point.
	 */
	const linePath = $derived.by(() => {
		const pts = points.map((p) => [xPct(p.i), y(p.g)] as const);
		const m = pts.length;
		if (m < 2) return '';
		const dx = pts.slice(1).map((p, k) => p[0] - pts[k][0]);
		const slope = pts.slice(1).map((p, k) => (p[1] - pts[k][1]) / dx[k]);
		const tan = pts.map((_, k) => {
			if (k === 0) return slope[0];
			if (k === m - 1) return slope[m - 2];
			const a = slope[k - 1];
			const b = slope[k];
			return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
		});
		let d = `M${pts[0][0]},${pts[0][1]}`;
		for (let k = 0; k < m - 1; k++) {
			const h = dx[k] / 3;
			d += ` C${pts[k][0] + h},${pts[k][1] + tan[k] * h} ${pts[k + 1][0] - h},${pts[k + 1][1] - tan[k + 1] * h} ${pts[k + 1][0]},${pts[k + 1][1]}`;
		}
		return d;
	});
	const areaPath = $derived(
		linePath
			? `${linePath} L${xPct(points[points.length - 1].i)},100 L${xPct(points[0].i)},100 Z`
			: ''
	);

	const peakIdx = $derived.by(() => {
		let best: { i: number; g: number } | null = null;
		for (const p of points) if (!best || p.g > best.g) best = p;
		return best?.i ?? -1;
	});
	const lastIdx = $derived(points.length ? points[points.length - 1].i : -1);

	const maxVol = $derived(Math.max(1, ...data.buckets.map((b) => b.volume)));

	/** "2019-Q3" → absolute quarter number, to spot jumps in time. */
	function quarterIndex(period: string): number | null {
		const m = period.match(/^(\d{4})-Q(\d)$/);
		return m ? Number(m[1]) * 4 + Number(m[2]) : null;
	}
	const xLabels = $derived(
		data.buckets.map((b, i) => {
			const [year, quarter = ''] = b.period.split('-');
			const prev = data.buckets[i - 1];
			const qi = quarterIndex(b.period);
			const qp = prev ? quarterIndex(prev.period) : null;
			return {
				year: year !== prev?.period.split('-')[0] ? year : '',
				sub: quarter,
				gap: qi != null && qp != null && qi - qp > 1
			};
		})
	);

	const LEGEND = [
		{ family: 'onsight', label: 'Onsight', color: '#54b41a' },
		{ family: 'flash', label: 'Flash', color: '#fee100' },
		{ family: 'redpoint', label: 'Red point', color: '#c90909' },
		{ family: 'pinkpoint', label: 'Pink point', color: '#e83e8c' },
		{ family: 'send', label: 'Send / clean', color: '#1d6fa5' },
		{ family: 'other', label: 'Attempts', color: '#b0b0b0' }
	];
	const usedFamilies = $derived(
		new Set(data.buckets.flatMap((b) => b.candles.map((c) => c.family)))
	);
	/** Like theCrag: paint attempts first so the purest tick (onsight) ends up on top. */
	const ORDER = ['other', 'send', 'pinkpoint', 'redpoint', 'flash', 'onsight'];
	const paintOrder = (candles: CprTimelineData['buckets'][number]['candles']) =>
		[...candles].sort((a, b) => ORDER.indexOf(a.family) - ORDER.indexOf(b.family));
	const colTitle = (b: CprTimelineData['buckets'][number]) =>
		[
			`${b.label}: ${b.volume} ascents`,
			...b.candles.map((c) => `${c.family} ${gradeLabel(c.min)}–${gradeLabel(c.max)} (${c.count})`)
		].join('\n');
</script>

<article class="panel">
	<header>
		<h3 style:--title={titleColor}>{title}</h3>
		<div class="scores">
			{#if data.peakScore != null}
				<span class="stat">
					<span class="k">Peak</span>
					<strong>{data.peakScore}</strong>
					{#if data.peakGrade != null}<em>≈ {gradeLabel(data.peakGrade)}</em>{/if}
				</span>
			{/if}
			{#if data.currentScore != null}
				<span class="stat">
					<span class="k">Current</span>
					<strong>{data.currentScore}</strong>
					{#if data.currentGrade != null}<em>≈ {gradeLabel(data.currentGrade)}</em>{/if}
				</span>
			{/if}
			<span
				class="src"
				title={data.source === 'api'
					? "CPR curve from theCrag's API"
					: 'Approximate CPR model (see Docs)'}
				>{data.source === 'api' ? 'theCrag CPR' : 'Approx.'}</span
			>
		</div>
	</header>

	{#if n === 0}
		<p class="empty">Not enough data for a CPR timeline yet.</p>
	{:else}
		<div class="chart">
			<div class="yaxis" aria-hidden="true">
				{#each ticks as t (t)}
					<span style:top="{y(t)}%">{gradeLabel(t)}</span>
				{/each}
			</div>
			<div class="plot">
				{#each bands as band (band.id)}
					<div class="band b{band.id}" style:top="{band.top}%" style:height="{band.height}%">
						{#if band.height > 9}<span>{band.name}</span>{/if}
					</div>
				{/each}
				{#each ticks as t (t)}
					<div class="grid" style:top="{y(t)}%"></div>
				{/each}

				<div class="cols" style:--n={n}>
					{#each data.buckets as b, i (b.period)}
						<div class="col" class:gap={xLabels[i].gap} title={colTitle(b)}>
							{#each paintOrder(b.candles) as c (c.family)}
								<div
									class="candle"
									style:top="{y(c.max)}%"
									style:height="max(4px, {y(c.min) - y(c.max)}%)"
									style:--c={c.color}
								></div>
							{/each}
						</div>
					{/each}
				</div>

				<svg class="cpr" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
					{#if areaPath}
						<path class="area" d={areaPath} />
						<path class="line" d={linePath} vector-effect="non-scaling-stroke" />
					{/if}
				</svg>
				{#each points as p (p.i)}
					<span
						class="dot"
						class:peak={p.i === peakIdx}
						class:last={p.i === lastIdx}
						style:left="{xPct(p.i)}%"
						style:top="{y(p.g)}%"
						title="CPR ≈ {gradeLabel(p.g)}"
					></span>
				{/each}
			</div>
		</div>

		<div class="xaxis" style:--n={n} aria-hidden="true">
			{#each xLabels as l, i (data.buckets[i].period)}
				<span class:gap={l.gap}>
					{#if l.gap}<i title="Gap in time">⋯</i>{/if}
					<b>{l.year}</b>{l.sub}
				</span>
			{/each}
		</div>

		<div class="volume" style:--n={n}>
			{#each data.buckets as b (b.period)}
				<a
					class="vcol"
					href="/logbook?style={encodeURIComponent(title)}&year={b.period.slice(0, 4)}"
					title="{b.label}: {b.volume} ascents — open logbook"
				>
					<span class="vbar" style:height="{Math.max(6, (b.volume / maxVol) * 100)}%"></span>
					<span class="vn">{b.volume}</span>
				</a>
			{/each}
		</div>

		<footer>
			<ul class="legend">
				<li><span class="sw line"></span>CPR</li>
				{#each LEGEND.filter((l) => usedFamilies.has(l.family)) as l (l.family)}
					<li><span class="sw" style:--c={l.color}></span>{l.label}</li>
				{/each}
			</ul>
			<p class="footnote">
				{#if data.source === 'api'}
					Curve from theCrag's API (decayed CPR); candles show your ticks.
				{:else}
					Approximate CPR: power factor 5, tick shifts, ~0.7 grade/year decay.
				{/if}
				<a href="/docs/cpr">How CPR works</a>
			</p>
		</footer>
	{/if}
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem 0.9rem;
		border-radius: 1rem;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem 1rem;
		flex-wrap: wrap;
		margin-bottom: 0.85rem;
	}
	h3 {
		margin: 0;
		color: color-mix(in srgb, var(--title, var(--ink)) 60%, var(--ink));
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 1rem;
	}
	.scores {
		display: flex;
		align-items: center;
		gap: 0.5rem 1.1rem;
		flex-wrap: wrap;
		font-size: 0.85rem;
	}
	.stat {
		display: inline-flex;
		align-items: baseline;
		gap: 0.35rem;
	}
	.stat .k,
	.stat em {
		color: var(--ink-muted);
	}
	.stat strong {
		font-size: 1.05rem;
		font-variant-numeric: tabular-nums;
	}
	.stat em {
		font-style: normal;
		font-size: 0.8rem;
	}
	.src {
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--ink-muted);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 0.1rem 0.55rem;
	}
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}

	.chart {
		display: grid;
		grid-template-columns: 2.4rem minmax(0, 1fr);
		height: 15rem;
	}
	.yaxis {
		position: relative;
		font-size: 0.72rem;
		color: var(--ink-muted);
		font-variant-numeric: tabular-nums;
	}
	.yaxis span {
		position: absolute;
		right: 0.5rem;
		transform: translateY(-50%);
	}
	.plot {
		position: relative;
		border-radius: 0.6rem;
		overflow: hidden;
		background: var(--surface-2);
	}
	.band {
		position: absolute;
		left: 0;
		right: 0;
		background: color-mix(in srgb, var(--band) 11%, transparent);
	}
	.band span {
		position: absolute;
		right: 0.5rem;
		top: 0.3rem;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: color-mix(in srgb, var(--band) 40%, var(--ink));
	}
	.b1 {
		--band: var(--band-beginner);
	}
	.b2 {
		--band: var(--band-intermediate);
	}
	.b3 {
		--band: var(--band-experienced);
	}
	.b4 {
		--band: var(--band-expert);
	}
	.b5 {
		--band: var(--band-elite);
	}
	.grid {
		position: absolute;
		left: 0;
		right: 0;
		border-top: 1px dashed color-mix(in srgb, var(--ink) 9%, transparent);
	}

	.cols {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
	}
	.col {
		position: relative;
	}
	.col.gap {
		border-left: 1px dashed color-mix(in srgb, var(--ink) 25%, transparent);
	}
	.col:hover {
		background: color-mix(in srgb, var(--ink) 4%, transparent);
	}
	.candle {
		position: absolute;
		left: 50%;
		width: clamp(6px, 40%, 22px);
		transform: translateX(-50%);
		border-radius: 4px;
		background: var(--c);
		box-shadow: 0 0 0 1.5px var(--paper);
	}

	.cpr {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
	.cpr .area {
		fill: color-mix(in srgb, var(--ink) 3.5%, transparent);
	}
	.cpr .line {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.dot {
		position: absolute;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--ink);
		box-shadow: 0 0 0 2px var(--paper);
		transform: translate(-50%, -50%);
	}
	.dot.peak,
	.dot.last {
		width: 12px;
		height: 12px;
		background: var(--paper);
		border: 3px solid var(--ink);
		box-shadow: none;
	}
	.dot.peak {
		border-color: var(--accent);
	}

	.xaxis {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		margin: 0.35rem 0 0 2.4rem;
		font-size: 0.68rem;
		color: var(--ink-muted);
		line-height: 1.25;
	}
	.xaxis span {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 0;
	}
	.xaxis b {
		color: var(--ink);
		font-weight: 700;
		min-height: 1.25em;
	}
	.xaxis i {
		position: absolute;
		left: -0.3em;
		top: -0.15em;
		font-style: normal;
	}

	.volume {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		align-items: end;
		height: 2.6rem;
		margin: 0.5rem 0 0 2.4rem;
	}
	.vcol {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: flex-end;
		height: 100%;
	}
	.vbar {
		width: clamp(6px, 55%, 26px);
		border-radius: 3px 3px 1px 1px;
		background: color-mix(in srgb, var(--ink) 16%, transparent);
	}
	.vcol:hover .vbar {
		background: var(--accent);
	}
	.vn {
		position: absolute;
		bottom: calc(100% + 2px);
		font-size: 0.65rem;
		color: var(--ink-muted);
		opacity: 0;
		transition: opacity 0.15s;
	}
	.vcol:hover .vn,
	.vcol:focus-visible .vn {
		opacity: 1;
	}

	footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem 1rem;
		margin-top: 0.75rem;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 0.85rem;
		list-style: none;
		margin: 0;
		padding: 0;
		font-size: 0.75rem;
		color: var(--ink-muted);
	}
	.legend li {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.sw {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 3px;
		background: var(--c);
	}
	.sw.line {
		height: 0;
		width: 1rem;
		border-top: 2.5px solid var(--ink);
		border-radius: 2px;
	}
	.footnote {
		margin: 0;
		font-size: 0.75rem;
		color: var(--ink-muted);
	}
	.footnote a {
		color: var(--accent);
		font-weight: 600;
	}

	@media (max-width: 640px) {
		.chart {
			height: 12rem;
		}
		.band span {
			display: none;
		}
	}
</style>
