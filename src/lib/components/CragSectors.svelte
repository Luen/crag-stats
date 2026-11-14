<script lang="ts">
	import SectorTreeList from '#lib/components/SectorTreeList.svelte';
	import { formatNumber } from '#lib/dates';
	import { DEFAULT_DISPLAY_UNITS, formatTemperature, type DisplayUnits } from '#lib/units';
	import type { CragSectorGroup } from '#lib/types/sectors';
	import type { DateDisplay } from '#lib/dates';

	let {
		crags,
		dateDisplay,
		displayUnits = DEFAULT_DISPLAY_UNITS
	}: {
		crags: CragSectorGroup[];
		dateDisplay: DateDisplay;
		displayUnits?: DisplayUnits;
	} = $props();

	let open = $state<Record<string, boolean>>({});

	function toggle(crag: string) {
		open = { ...open, [crag]: !open[crag] };
	}
</script>

<section class="panel">
	<h2>Crags and sectors ({crags.length})</h2>
	<p class="hint">
		All logged climbs, independent of the map filters. Expand a crag to explore its sectors.
	</p>
	{#if crags.length === 0}
		<p class="empty">No climbed routes yet.</p>
	{:else}
		<ul class="crags">
			{#each crags as crag (crag.cragName)}
				<li>
					<button
						type="button"
						class="crag-btn"
						aria-expanded={!!open[crag.cragName]}
						onclick={() => toggle(crag.cragName)}
					>
						<span class="chev" aria-hidden="true">{open[crag.cragName] ? '▾' : '▸'}</span>
						<strong>{crag.cragName}</strong>
						<span class="meta"
							>{crag.routeCount} routes · {crag.ascentCount} ascents · {crag.sectors.length} top sectors</span
						>
					</button>
					<a class="log" href="/logbook?crag={encodeURIComponent(crag.cragName)}">Logbook</a>
					{#if crag.areaBreadcrumb}
						<p class="breadcrumb">{crag.areaBreadcrumb}</p>
					{/if}
					{#if crag.visitClimate}
						{@const c = crag.visitClimate}
						<p class="climate">
							<strong>On your {formatNumber(c.days, dateDisplay)} cached visit days:</strong>
							{#if c.avgHighC != null}average high {formatTemperature(
									c.avgHighC,
									displayUnits.temperature
								)}{/if}{#if c.avgLowC != null}, low {formatTemperature(
									c.avgLowC,
									displayUnits.temperature
								)}{/if}
							· rain {formatNumber(c.rainPct, dateDisplay)}%{#if c.snowPct > 0}
								· snow {formatNumber(c.snowPct, dateDisplay)}%{/if}{#if c.freezePct > 0}
								· freezing {formatNumber(c.freezePct, dateDisplay)}%{/if}{#if c.heatPct > 0}
								· hot {formatNumber(c.heatPct, dateDisplay)}%{/if}
							<span class="note"
								>Weather on the days you climbed here, not official climate normals.</span
							>
							<a class="how" href="/docs/weather">How it works</a>
						</p>
					{/if}
					{#if open[crag.cragName]}
						<SectorTreeList
							cragName={crag.cragName}
							sectors={crag.sectors}
							nested={crag.hasAreaTree}
						/>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h2 {
		margin: 0;
	}
	.hint,
	.empty,
	.meta,
	.breadcrumb {
		color: var(--ink-muted);
		font-size: 0.88rem;
	}
	.hint {
		margin: 0.35rem 0 0.75rem;
	}
	.breadcrumb {
		grid-column: 1 / -1;
		margin: 0.15rem 0 0 1.25rem;
	}
	.climate {
		grid-column: 1 / -1;
		margin: 0.15rem 0 0 1.25rem;
		font-size: 0.85rem;
		color: var(--ink-muted);
	}
	.climate strong {
		color: var(--ink);
	}
	.crags {
		list-style: none;
		margin: 0.85rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.55rem;
	}
	.crags > li {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.35rem 0.75rem;
		align-items: start;
		padding-bottom: 0.55rem;
		border-bottom: 1px solid var(--line);
	}
	.crag-btn {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.35rem 0.65rem;
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: inherit;
		cursor: pointer;
		text-align: left;
	}
	.chev {
		width: 0.9rem;
		color: var(--ink-muted);
	}
	.log {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
	:global(.crags .sectors) {
		grid-column: 1 / -1;
	}
</style>
