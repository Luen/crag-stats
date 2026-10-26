<script lang="ts">
	import BarList from '#lib/components/BarList.svelte';
	import GradeChip from '#lib/components/GradeChip.svelte';
	import VolumeChart from '#lib/components/VolumeChart.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const s = $derived(data.stats);
</script>

<section class="hero panel">
	<div>
		<p class="eyebrow">Personal climbing analytics</p>
		<h1>{s.profileName ? `${s.profileName}'s crag year` : 'Your climbing, quantified'}</h1>
		<p class="lede">
			Turn theCrag ascent history into performance analytics, project tracking, and clearer training
			focus — self-hosted, MIT licensed.
		</p>
	</div>
	<div class="sync">
		<span class="pill" class:ok={data.sync.status === 'idle'} class:err={data.sync.status === 'error'}>
			{data.sync.status}
		</span>
		{#if data.sync.lastSuccessAt}
			<small>Last sync {new Date(data.sync.lastSuccessAt).toLocaleString()}</small>
		{:else}
			<small>No API sync yet — import a CSV or sync from Settings</small>
		{/if}
	</div>
</section>

{#if s.totalAscents === 0}
	<section class="panel empty">
		<h2>Get started</h2>
		<ol>
			<li>Add <code>THECRAG_API_KEY</code> for Supporters, or</li>
			<li>Upload a theCrag CSV export on <a href="/settings">Settings</a></li>
		</ol>
	</section>
{:else}
	<section class="metrics">
		<div class="metric panel">
			<span>Ascents</span>
			<strong>{s.totalAscents}</strong>
		</div>
		<div class="metric panel">
			<span>Sends</span>
			<strong>{s.totalSends}</strong>
		</div>
		<div class="metric panel">
			<span>Height</span>
			<strong>{s.heightM.toLocaleString()} m</strong>
		</div>
		<div class="metric panel">
			<span>Routes / Crags</span>
			<strong>{s.distinctRoutes} / {s.distinctCrags}</strong>
		</div>
	</section>

	<section class="grid">
		<article class="panel">
			<h2>Volume</h2>
			<VolumeChart data={s.volumeByMonth} />
		</article>
		<article class="panel">
			<h2>Grade bands</h2>
			<p class="hint">Colours match theCrag: Beginner → Elite</p>
			<BarList
				items={s.bandBreakdown.map((b) => ({
					label: b.name,
					value: b.count,
					color: b.color
				}))}
			/>
		</article>
		<article class="panel">
			<h2>Top crags</h2>
			<BarList
				items={s.topCrags.map((c) => ({
					label: c.crag,
					value: c.count,
					meta: c.maxGrade ? `up to ${c.maxGrade}` : undefined,
					color: 'var(--accent-2)'
				}))}
			/>
		</article>
		<article class="panel">
			<h2>Tick types</h2>
			<BarList
				items={s.tickBreakdown.map((t) => ({
					label: t.tick,
					value: t.count
				}))}
			/>
		</article>
		<article class="panel wide">
			<h2>Grade pyramid (sends)</h2>
			{#if s.gradePyramid.length === 0}
				<p class="hint">No graded sends yet.</p>
			{:else}
				<div class="pyramid">
					{#each s.gradePyramid as g (g.score)}
						<div class="py-row">
							<span class="g"><GradeChip grade={g.grade} band={g.band} /></span>
							<div class="py-track">
								<div
									class="py-fill"
									style:width="{Math.max(8, (g.count / Math.max(...s.gradePyramid.map((x) => x.count))) * 100)}%"
									style:background={g.color}
								>
									{g.count}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</article>
		<article class="panel">
			<h2>Hardest sends</h2>
			<ul class="list">
				{#each s.hardestSends as climb (climb.routeName + (climb.ascentDate ?? ''))}
					<li>
						<div>
							<strong>{climb.routeName}</strong>
							<div class="sub">{climb.cragName} · {climb.tickType}</div>
						</div>
						<GradeChip grade={climb.gradeRaw} band={climb.gradeBand} />
					</li>
				{/each}
			</ul>
		</article>
		<article class="panel">
			<h2>Recent</h2>
			<ul class="list">
				{#each s.recent as climb (climb.id)}
					<li>
						<div>
							<strong>{climb.routeName}</strong>
							<div class="sub">
								{(climb.ascentDate || '').slice(0, 10)} · {climb.tickType} · {climb.cragName}
							</div>
						</div>
						<GradeChip grade={climb.gradeRaw} band={climb.gradeBand} />
					</li>
				{/each}
			</ul>
		</article>
	</section>
{/if}

<style>
	.hero {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 1.25rem;
		padding: 1.4rem 1.5rem;
		margin-bottom: 1rem;
		border-radius: 1rem;
	}
	.eyebrow {
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-size: 0.75rem;
		color: var(--ink-muted);
		margin: 0 0 0.35rem;
		font-weight: 700;
	}
	h1 {
		margin: 0;
		font-size: clamp(1.8rem, 4vw, 2.6rem);
		max-width: 16ch;
		line-height: 1.05;
	}
	.lede {
		margin: 0.7rem 0 0;
		max-width: 42ch;
		color: var(--ink-muted);
	}
	.sync {
		display: grid;
		align-content: start;
		gap: 0.4rem;
		min-width: 12rem;
	}
	.pill {
		display: inline-flex;
		width: fit-content;
		padding: 0.25rem 0.65rem;
		border-radius: 999px;
		background: rgba(28, 36, 24, 0.08);
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
	}
	.pill.ok {
		background: rgba(84, 180, 26, 0.2);
	}
	.pill.err {
		background: rgba(201, 9, 9, 0.15);
	}
	.metrics {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.75rem;
		margin-bottom: 1rem;
	}
	.metric {
		padding: 1rem 1.1rem;
		border-radius: 0.9rem;
	}
	.metric span {
		display: block;
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	.metric strong {
		font-size: 1.55rem;
		font-family: Fraunces, Georgia, serif;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.9rem;
	}
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.wide {
		grid-column: 1 / -1;
	}
	h2 {
		margin: 0 0 0.85rem;
		font-size: 1.2rem;
	}
	.hint {
		margin: -0.4rem 0 0.8rem;
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.7rem;
	}
	.list li {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: center;
	}
	.sub {
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	.pyramid {
		display: grid;
		gap: 0.45rem;
	}
	.py-row {
		display: grid;
		grid-template-columns: 5.5rem 1fr;
		gap: 0.6rem;
		align-items: center;
	}
	.py-track {
		background: rgba(28, 36, 24, 0.06);
		border-radius: 999px;
		overflow: hidden;
		min-height: 1.35rem;
	}
	.py-fill {
		min-width: 1.5rem;
		padding: 0.15rem 0.5rem;
		color: #111;
		font-size: 0.8rem;
		font-weight: 700;
		text-align: right;
	}
	.empty {
		padding: 1.25rem 1.4rem;
		border-radius: 1rem;
	}
	.empty ol {
		margin: 0.5rem 0 0;
		color: var(--ink-muted);
	}
	@media (max-width: 840px) {
		.metrics,
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
