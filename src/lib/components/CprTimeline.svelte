<script lang="ts">
	import type { CprTimelineData } from '#lib/types/dashboard';

	type Props = { title: string; data: CprTimelineData; gradeMin?: number; gradeMax?: number };
	let { title, data, gradeMin, gradeMax }: Props = $props();

	const grades = $derived.by(() => {
		const vals: number[] = [];
		for (const b of data.buckets) {
			for (const c of b.candles) {
				vals.push(c.min, c.max);
			}
			if (b.cprGrade != null) vals.push(b.cprGrade);
		}
		if (!vals.length) return { min: gradeMin ?? 0, max: gradeMax ?? 10 };
		const min = gradeMin ?? Math.floor(Math.min(...vals) - 1);
		const max = gradeMax ?? Math.ceil(Math.max(...vals) + 1);
		return { min, max: Math.max(min + 1, max) };
	});

	const maxVol = $derived(Math.max(1, ...data.buckets.map((b) => b.volume)));

	function y(score: number) {
		const span = grades.max - grades.min;
		return ((grades.max - score) / span) * 100;
	}

	function bandStops() {
		// approximate beginner→elite backgrounds for route grades; boulder uses different scale but same colours
		return [
			{ top: 0, h: 20, color: 'rgba(178,24,130,0.12)' },
			{ top: 20, h: 20, color: 'rgba(201,9,9,0.10)' },
			{ top: 40, h: 20, color: 'rgba(229,131,41,0.12)' },
			{ top: 60, h: 20, color: 'rgba(254,225,0,0.14)' },
			{ top: 80, h: 20, color: 'rgba(84,180,26,0.12)' }
		];
	}

	const cprPoints = $derived(
		data.buckets
			.map((b, i) => (b.cprGrade == null ? null : { i, g: b.cprGrade, s: b.cprScore }))
			.filter(Boolean) as { i: number; g: number; s: number | null }[]
	);
</script>

<article class="panel">
	<header>
		<h3>{title}</h3>
		<div class="scores">
			{#if data.peakScore != null}
				<span>Peak CPR <strong>{data.peakScore}</strong></span>
			{/if}
			{#if data.currentScore != null}
				<span>Current <strong>{data.currentScore}</strong></span>
			{/if}
			<span
				class="src"
				title={data.source === 'api' ? 'theCrag CPR from API' : 'Approximate CPR model'}
				>{data.source === 'api' ? 'API CPR' : 'Approx CPR'}</span
			>
		</div>
	</header>

	{#if data.buckets.length === 0}
		<p class="empty">Not enough data for a CPR timeline yet.</p>
	{:else}
		<div class="chart">
			<div class="yaxis">
				<span>{grades.max}</span>
				<span>{Math.round((grades.min + grades.max) / 2)}</span>
				<span>{grades.min}</span>
			</div>
			<div class="plot">
				{#each bandStops() as stop (stop.top)}
					<div
						class="band"
						style:top="{stop.top}%"
						style:height="{stop.h}%"
						style:background={stop.color}
					></div>
				{/each}
				<div class="cols" style:--n={data.buckets.length}>
					{#each data.buckets as b, i (b.period)}
						<div class="col">
							<div class="candles">
								{#each b.candles as c (c.family)}
									<div
										class="candle"
										style:top="{y(c.max)}%"
										style:height="{Math.max(2, y(c.min) - y(c.max))}%"
										style:background={c.color}
										title="{c.family}: {c.min}–{c.max} ({c.count})"
									></div>
								{/each}
							</div>
							<span class="label">{b.label.replace('-', '\n')}</span>
						</div>
					{/each}
				</div>
				<svg class="cpr-line" viewBox="0 0 100 100" preserveAspectRatio="none">
					{#if cprPoints.length > 1}
						<polyline
							fill="none"
							stroke="#111"
							stroke-width="1.2"
							vector-effect="non-scaling-stroke"
							points={cprPoints
								.map((p) => {
									const x = ((p.i + 0.5) / data.buckets.length) * 100;
									return `${x},${y(p.g)}`;
								})
								.join(' ')}
						/>
						{#each cprPoints as p (p.i)}
							<circle
								cx={((p.i + 0.5) / data.buckets.length) * 100}
								cy={y(p.g)}
								r="1.1"
								fill="#111"
							/>
						{/each}
					{/if}
				</svg>
			</div>
		</div>
		<div class="volume" style:--n={data.buckets.length}>
			{#each data.buckets as b (b.period)}
				<a
					class="vcol"
					href="/logbook?style={encodeURIComponent(title)}&year={b.period.slice(0, 4)}"
					title="{b.period}: {b.volume} ascents — open logbook"
				>
					<span class="vn">{b.volume}</span>
					<div class="vbar" style:height="{(b.volume / maxVol) * 100}%"></div>
				</a>
			{/each}
		</div>
		<p class="footnote">
			{#if data.source === 'api'}
				CPR curve from theCrag API (decayed) where available · candles still show your ticks ·
			{:else}
				Approximate CPR (power factor 5, tick shifts, 0.7 grade/year decay) ·
			{/if}
			<a href="https://www.thecrag.com/en/article/cprtimeline" target="_blank" rel="noreferrer"
				>theCrag CPR timeline</a
			>.
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
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
	}
	h3 {
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-size: 1rem;
	}
	.scores {
		display: flex;
		gap: 1rem;
		font-size: 0.9rem;
		color: var(--ink-muted);
		align-items: center;
		flex-wrap: wrap;
	}
	.src {
		font-size: 0.75rem;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		border: 1px solid var(--line);
	}
	.vcol {
		text-decoration: none;
		color: inherit;
	}
	.chart {
		display: grid;
		grid-template-columns: 2.2rem 1fr;
		gap: 0.35rem;
		height: 220px;
	}
	.yaxis {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		font-size: 0.7rem;
		color: var(--ink-muted);
		text-align: right;
		padding-right: 0.2rem;
	}
	.plot {
		position: relative;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.45);
	}
	.band {
		position: absolute;
		left: 0;
		right: 0;
	}
	.cols {
		position: absolute;
		inset: 0;
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		z-index: 1;
	}
	.col {
		position: relative;
		border-left: 1px solid rgba(28, 36, 24, 0.04);
	}
	.candles {
		position: absolute;
		inset: 0 18% 1.4rem;
	}
	.candle {
		position: absolute;
		left: 0;
		right: 0;
		border-radius: 2px;
		opacity: 0.9;
	}
	.label {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0.1rem;
		font-size: 0.55rem;
		text-align: center;
		color: var(--ink-muted);
		white-space: pre-line;
		line-height: 1.05;
	}
	.cpr-line {
		position: absolute;
		inset: 0 0 1.4rem;
		width: 100%;
		height: calc(100% - 1.4rem);
		z-index: 2;
		pointer-events: none;
	}
	.volume {
		display: grid;
		grid-template-columns: repeat(var(--n), minmax(0, 1fr));
		align-items: end;
		height: 56px;
		margin: 0.55rem 0 0 2.55rem;
		gap: 1px;
	}
	.vcol {
		display: grid;
		grid-template-rows: auto 1fr;
		height: 100%;
		align-items: end;
		justify-items: center;
	}
	.vn {
		font-size: 0.6rem;
		color: var(--ink-muted);
	}
	.vbar {
		width: 55%;
		background: rgba(28, 36, 24, 0.28);
		border-radius: 2px 2px 0 0;
		min-height: 2px;
	}
	.footnote,
	.empty {
		margin: 0.65rem 0 0;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
	.footnote a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
</style>
