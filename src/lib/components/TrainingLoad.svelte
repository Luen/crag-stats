<script lang="ts">
	import { formatVScaleLabel } from '#lib/grades';
	import type { LoadStatus, TrainingLoadView } from '#lib/types/trainingLoad';

	type Props = {
		load: TrainingLoadView;
		/** Dashboard shows the newest N weeks; detail page can show all. */
		weeksShown?: number;
		titleHref?: string | null;
		showDaily?: boolean;
	};
	let { load, weeksShown = 12, titleHref = '/training-load', showDaily = false }: Props = $props();

	const STATUS: Record<LoadStatus, { label: string; hint: string }> = {
		idle: { label: 'Resting', hint: 'Nothing logged in the last couple of weeks.' },
		detraining: {
			label: 'Below usual',
			hint: 'Lighter than your recent norm: fresh, tapering, or losing fitness.'
		},
		optimal: { label: 'Sweet spot', hint: 'Load is in line with what you are used to (0.8–1.3).' },
		building: { label: 'Ramping up', hint: 'Load is climbing quickly (1.3–1.5). Watch recovery.' },
		spike: {
			label: 'Spike',
			hint: 'Much more than usual (> 1.5): the zone most linked to finger and shoulder tweaks.'
		}
	};

	const status = $derived(STATUS[load.status]);
	/** Gauge position for the ratio, 0–2 mapped to 0–100%. */
	const gauge = $derived(load.ratio == null ? null : Math.min(100, (load.ratio / 2) * 100));
	const weeks = $derived(load.weekly.slice(-Math.max(1, weeksShown)));
	const maxWeek = $derived(Math.max(1, ...weeks.map((w) => w.load)));
	const maxDay = $derived(Math.max(1, ...load.daily28.map((d) => d.load)));
	const pct = (n: number) => `${Math.round(n)}%`;

	const refs = $derived(
		[
			load.refRoute != null ? `routes ${Math.round(load.refRoute)}` : null,
			load.refBoulder != null ? `boulders ${formatVScaleLabel(load.refBoulder)}` : null
		].filter(Boolean)
	);
</script>

<article class="panel">
	<header>
		<h2>
			{#if titleHref}
				<a href={titleHref}>Training load</a>
			{:else}
				Training load
			{/if}
		</h2>
		<a class="how" href="/docs/training-load">How it works</a>
	</header>

	<div class="top">
		<div class="ratio" data-status={load.status}>
			<span class="k">Acute : chronic</span>
			<strong>{load.ratio != null ? load.ratio.toFixed(2) : '—'}</strong>
			<span class="pill">{status.label}</span>
		</div>
		<div class="meter" aria-hidden="true">
			<div class="zones">
				<span class="z low"></span><span class="z ok"></span><span class="z hi"></span><span
					class="z spike"
				></span>
			</div>
			{#if gauge != null}<span class="needle" style:left="{gauge}%"></span>{/if}
			<div class="ticks">
				<span>0</span><span>0.8</span><span>1.3</span><span>1.5</span><span>2</span>
			</div>
		</div>
		<p class="hint">{status.hint}</p>
	</div>

	<div class="weeks" aria-label="Weekly load, last {weeks.length} weeks">
		{#each weeks as w (w.end)}
			<span
				class="wk"
				style:height="{Math.max(4, (w.load / maxWeek) * 100)}%"
				title="Week to {w.end}: load {w.load}"
			></span>
		{/each}
	</div>
	<p class="weeks-cap">Weekly load · last {weeks.length} weeks</p>

	{#if showDaily && load.daily28.length}
		<div class="days" aria-label="Daily load, last 28 days">
			{#each load.daily28 as d (d.day)}
				<span
					class="day"
					class:rest={d.load <= 0}
					style:height="{d.load <= 0 ? 4 : Math.max(4, (d.load / maxDay) * 100)}%"
					title="{d.day}: load {d.load}"
				></span>
			{/each}
		</div>
		<p class="weeks-cap">Daily load · last 28 days</p>
	{/if}

	<dl class="kpis">
		<div>
			<dt>Fatigue (7-day)</dt>
			<dd>{load.acute}</dd>
		</div>
		<div>
			<dt>Fitness (28-day)</dt>
			<dd>{load.chronic}</dd>
		</div>
		<div>
			<dt>Near-limit sends · 28d</dt>
			<dd>{load.limitSends28}</dd>
		</div>
		<div>
			<dt>Near-limit share · 28d</dt>
			<dd>{pct(load.limitShare28)}</dd>
		</div>
	</dl>
	{#if refs.length}
		<p class="ref">
			Intensity is measured against your hardest sends of the last 12 months: {refs.join(' · ')}.
		</p>
	{/if}

	<div class="cols">
		{#each [{ t: 'Last 7 days', w: load.last7, rest: load.restDays7, rate: load.sendRate7 }, { t: 'Last 28 days', w: load.last28, rest: load.restDays28, rate: load.sendRate28 }] as col (col.t)}
			<section>
				<h3>{col.t}</h3>
				<dl>
					<div>
						<dt>Ascents</dt>
						<dd>{col.w.ascents}</dd>
					</div>
					<div>
						<dt>Sends</dt>
						<dd>{col.w.sends}</dd>
					</div>
					<div>
						<dt>Active / rest days</dt>
						<dd>{col.w.activeDays} / {col.rest}</dd>
					</div>
					<div>
						<dt>Height</dt>
						<dd>{Math.round(col.w.heightM)} m</dd>
					</div>
					<div>
						<dt>Send rate</dt>
						<dd>{pct(col.rate)}</dd>
					</div>
				</dl>
			</section>
		{/each}
	</div>
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
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	h2 a {
		color: inherit;
		text-decoration: none;
	}
	h2 a:hover {
		color: var(--accent);
	}
	.how {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--accent);
	}
	.top {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.4rem 1.25rem;
		align-items: center;
	}
	.ratio {
		display: grid;
		gap: 0.15rem;
		--s: var(--ink-muted);
	}
	.ratio[data-status='optimal'] {
		--s: var(--band-beginner);
	}
	.ratio[data-status='building'] {
		--s: var(--band-experienced);
	}
	.ratio[data-status='spike'] {
		--s: var(--band-expert);
	}
	.ratio[data-status='detraining'] {
		--s: var(--style-sport);
	}
	.ratio .k {
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink-muted);
		font-weight: 700;
	}
	.ratio strong {
		font-size: 2rem;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}
	.pill {
		width: fit-content;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.1rem 0.55rem;
		border-radius: 999px;
		color: color-mix(in srgb, var(--s) 60%, var(--ink));
		background: color-mix(in srgb, var(--s) 16%, var(--paper));
	}
	.meter {
		position: relative;
		padding-top: 0.35rem;
	}
	.zones {
		display: grid;
		grid-template-columns: 40fr 25fr 10fr 25fr;
		height: 0.55rem;
		border-radius: 999px;
		overflow: hidden;
	}
	.z.low {
		background: color-mix(in srgb, var(--style-sport) 35%, var(--paper));
	}
	.z.ok {
		background: color-mix(in srgb, var(--band-beginner) 60%, var(--paper));
	}
	.z.hi {
		background: color-mix(in srgb, var(--band-experienced) 60%, var(--paper));
	}
	.z.spike {
		background: color-mix(in srgb, var(--band-expert) 55%, var(--paper));
	}
	.needle {
		position: absolute;
		top: 0;
		width: 4px;
		height: 1.25rem;
		border-radius: 2px;
		background: var(--ink);
		box-shadow: 0 0 0 2px var(--paper);
		transform: translateX(-50%);
	}
	.ticks {
		position: relative;
		height: 1rem;
		font-size: 0.65rem;
		color: var(--ink-muted);
	}
	.ticks span {
		position: absolute;
		top: 0.2rem;
		transform: translateX(-50%);
	}
	.ticks span:nth-child(1) {
		left: 0;
		transform: none;
	}
	.ticks span:nth-child(2) {
		left: 40%;
	}
	.ticks span:nth-child(3) {
		left: 65%;
	}
	.ticks span:nth-child(4) {
		left: 75%;
	}
	.ticks span:nth-child(5) {
		right: 0;
		left: auto;
		transform: none;
	}
	.hint {
		grid-column: 1 / -1;
		margin: 0.35rem 0 0;
		font-size: 0.85rem;
		color: var(--ink-muted);
	}
	.weeks {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		align-items: end;
		gap: 4px;
		height: 3.5rem;
		margin-top: 1rem;
	}
	.wk {
		border-radius: 3px 3px 1px 1px;
		background: color-mix(in srgb, var(--accent) 55%, var(--paper));
	}
	.wk:last-child {
		background: var(--accent);
	}
	.days {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		align-items: end;
		gap: 3px;
		height: 3.25rem;
		margin-top: 0.85rem;
	}
	.day {
		border-radius: 2px 2px 1px 1px;
		background: color-mix(in srgb, var(--accent-2) 55%, var(--paper));
	}
	.day.rest {
		background: var(--surface-3);
	}
	.day:last-child {
		background: var(--accent-2);
	}
	.weeks-cap,
	.ref {
		margin: 0.3rem 0 0;
		font-size: 0.72rem;
		color: var(--ink-muted);
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.5rem;
		margin: 0.9rem 0 0;
	}
	.kpis > div {
		display: grid;
		gap: 0.1rem;
		padding: 0.55rem 0.65rem;
		border-radius: 0.6rem;
		background: var(--surface-2);
	}
	.kpis dt {
		font-size: 0.72rem;
		color: var(--ink-muted);
	}
	.kpis dd {
		margin: 0;
		font-weight: 700;
		font-size: 1.15rem;
		font-variant-numeric: tabular-nums;
	}
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.85rem;
		margin-top: 1rem;
	}
	h3 {
		margin: 0 0 0.4rem;
		font-size: 0.78rem;
		color: var(--ink-muted);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.cols dl {
		margin: 0;
		display: grid;
	}
	.cols dl > div {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.3rem 0;
		border-bottom: 1px solid var(--line);
		font-size: 0.88rem;
	}
	.cols dl > div:last-child {
		border-bottom: none;
	}
	.cols dt {
		color: var(--ink-muted);
	}
	.cols dd {
		margin: 0;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	@media (max-width: 560px) {
		.top {
			grid-template-columns: 1fr;
		}
		.kpis {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.cols {
			grid-template-columns: 1fr;
		}
	}
</style>
