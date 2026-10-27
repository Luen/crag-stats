<script lang="ts">
	import CragMap from '#lib/components/CragMap.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let open = $state<Record<string, boolean>>({});

	function toggle(crag: string) {
		open = { ...open, [crag]: !open[crag] };
	}
</script>

<section class="panel head">
	<h1>Sectors</h1>
	<p>Crags and sectors from your logbook, plus a simple geo plot when coordinates are available.</p>
</section>

{#if data.mapPoints.length > 0}
	<section class="panel map-panel">
		<h2>Crag map</h2>
		<p class="hint">Marker size ≈ ascent volume. Click a point to open the logbook filter.</p>
		<CragMap points={data.mapPoints} />
	</section>
{/if}

<section class="panel">
	<h2>Crags ({data.crags.length})</h2>
	{#if data.crags.length === 0}
		<p class="empty">No climbed routes yet.</p>
	{:else}
		<ul class="crags">
			{#each data.crags as crag (crag.cragName)}
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
							>{crag.routeCount} routes · {crag.ascentCount} ascents · {crag.sectors.length} sectors</span
						>
					</button>
					<a class="log" href="/logbook?crag={encodeURIComponent(crag.cragName)}">Logbook</a>
					{#if open[crag.cragName]}
						<ul class="sectors">
							{#each crag.sectors as sector (sector.name)}
								<li>
									<a
										href="/logbook?crag={encodeURIComponent(
											crag.cragName
										)}&sector={encodeURIComponent(sector.name)}">{sector.name}</a
									>
									<span class="meta">{sector.routeCount} routes · {sector.ascentCount} ascents</span
									>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.head,
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.head,
	.map-panel {
		margin-bottom: 0.9rem;
	}
	h1,
	h2 {
		margin: 0;
	}
	.head p,
	.hint,
	.empty,
	.meta {
		color: var(--ink-muted);
		font-size: 0.88rem;
	}
	.head p,
	.hint {
		margin: 0.35rem 0 0.75rem;
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
	.sectors {
		grid-column: 1 / -1;
		list-style: none;
		margin: 0.15rem 0 0 1.25rem;
		padding: 0;
		display: grid;
		gap: 0.35rem;
	}
	.sectors li {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
		font-size: 0.92rem;
	}
</style>
