<script lang="ts">
	import land from '#lib/assets/world-land.json';
	import {
		clusterMapPlaces,
		fitMapPlaces,
		longitudeCentre,
		projectMapPoint,
		type ClimbingPlace,
		type MapView
	} from '#lib/climbingMap';
	import {
		DEFAULT_DATE_DISPLAY,
		formatCalendarDate,
		formatNumber,
		type DateDisplay
	} from '#lib/dates';
	let {
		places,
		dateDisplay = DEFAULT_DATE_DISPLAY
	}: { places: ClimbingPlace[]; dateDisplay?: DateDisplay } = $props();
	const centre = $derived(longitudeCentre(places));
	let customView = $state<MapView | null>(null);
	const view = $derived(customView ?? fitMapPlaces(places, centre));
	let mode = $state<'circles' | 'glow'>('circles');
	let selectedKey = $state<string | null>(null);
	const clusters = $derived(clusterMapPlaces(places, view, centre));
	const selected = $derived(clusters.find((c) => c.key === selectedKey));
	const max = $derived(Math.max(1, ...clusters.map((c) => c.count)));
	const outline = $derived(
		land
			.map((ring) => {
				let prev: number | null = null;
				return ring
					.map(([lon, lat]) => {
						const p = projectMapPoint(lat, lon, centre);
						const move = prev == null || Math.abs(p.x - prev) > 500;
						prev = p.x;
						return `${move ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
					})
					.join(' ');
			})
			.join(' ')
	);
	function zoom(factor: number) {
		const width = Math.min(1000, Math.max(8, view.width * factor));
		customView = {
			x: view.x + (view.width - width) / 2,
			y: Math.max(0, Math.min(500 - width / 2, view.y + (view.height - width / 2) / 2)),
			width,
			height: width / 2
		};
		selectedKey = null;
	}
	function pan(dx: number, dy: number) {
		customView = {
			...view,
			x: Math.max(-100, Math.min(1100 - view.width, view.x + (dx * view.width) / 4)),
			y: Math.max(0, Math.min(500 - view.height, view.y + (dy * view.height) / 4))
		};
		selectedKey = null;
	}
	const label = (c: (typeof clusters)[number]) =>
		`${c.places.length === 1 ? c.places[0].name : `${c.places.length} places`} · ${formatNumber(c.count, dateDisplay)} ascents`;
</script>

<div class="controls">
	<div role="group" aria-label="Map display">
		<button type="button" aria-pressed={mode === 'circles'} onclick={() => (mode = 'circles')}
			>Circles</button
		><button type="button" aria-pressed={mode === 'glow'} onclick={() => (mode = 'glow')}
			>Glow</button
		>
	</div>
	<div role="group" aria-label="Map navigation">
		<button type="button" onclick={() => zoom(0.6)} aria-label="Zoom in">+</button><button
			type="button"
			onclick={() => zoom(1 / 0.6)}
			aria-label="Zoom out">−</button
		>
		<button type="button" onclick={() => pan(-1, 0)} aria-label="Pan west">←</button><button
			type="button"
			onclick={() => pan(1, 0)}
			aria-label="Pan east">→</button
		><button type="button" onclick={() => pan(0, -1)} aria-label="Pan north">↑</button><button
			type="button"
			onclick={() => pan(0, 1)}
			aria-label="Pan south">↓</button
		>
		<button
			type="button"
			onclick={() => {
				customView = null;
				selectedKey = null;
			}}>Fit places</button
		><button
			type="button"
			onclick={() => {
				customView = { x: 0, y: 0, width: 1000, height: 500 };
				selectedKey = null;
			}}>World</button
		>
	</div>
</div>
<div class="world-map" role="group" aria-label="Worldwide climbing places">
	<svg
		viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
		preserveAspectRatio="none"
		aria-hidden="true"><path class="land" d={outline} /></svg
	>
	{#each clusters as c (c.key)}
		{@const size = 28 + 24 * Math.sqrt(c.count / max)}
		<button
			type="button"
			class={['marker', { glow: mode === 'glow' }]}
			style:left={`${((c.x - view.x) / view.width) * 100}%`}
			style:top={`${((c.y - view.y) / view.height) * 100}%`}
			style:width={`${size}px`}
			style:height={`${size}px`}
			style:--strength={0.25 + (0.65 * c.count) / max}
			aria-label={label(c)}
			aria-pressed={selectedKey === c.key}
			onclick={() => (selectedKey = selectedKey === c.key ? null : c.key)}
			title={label(c)}>{formatNumber(c.count, dateDisplay)}</button
		>
	{/each}
</div>
<p class="legend">
	Larger circles mean more logged ascents; Glow adds stronger light for higher counts. Nearby places
	cluster at this zoom. Select a marker for details.
</p>
{#if selected}
	<section class="selection" aria-label="Selected map places" aria-live="polite">
		<h2>{label(selected)}</h2>
		{#if selected.places.length > 1}<button
				type="button"
				onclick={() => {
					// Small floor so close places separate; the spread padding keeps all of them in view.
					customView = fitMapPlaces(selected.places, centre, 8);
					selectedKey = null;
				}}>Zoom to these places</button
			>{/if}
		<ul>
			{#each selected.places as p (p.key)}<li>
					<a href={p.href}
						>{p.name}{p.country ? ` · ${p.country}` : ''}: {formatNumber(p.count, dateDisplay)} ascents</a
					>
					· {p.routes} routes · {p.firstDay
						? formatCalendarDate(p.firstDay, dateDisplay)
						: 'Date unknown'}–{p.lastDay
						? formatCalendarDate(p.lastDay, dateDisplay)
						: 'date unknown'}
				</li>{/each}
		</ul>
	</section>
{/if}
<p class="credit">
	Outline: <a
		href="https://www.naturalearthdata.com/about/terms-of-use/"
		target="_blank"
		rel="noreferrer">Natural Earth</a
	> (public domain). Locations are from your cached logbook and may be approximate.
</p>

<style>
	.controls,
	.controls > div {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		align-items: center;
	}
	.controls {
		justify-content: space-between;
		margin-bottom: 0.75rem;
		gap: 0.75rem;
	}
	button {
		border: 1px solid var(--line);
		background: var(--paper);
		color: var(--ink);
		padding: 0.35rem 0.55rem;
		border-radius: 0.5rem;
		font: inherit;
		cursor: pointer;
	}
	button[aria-pressed='true'] {
		border-color: var(--accent-2);
		background: var(--surface-2);
		font-weight: 700;
	}
	button:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 3px;
	}
	.world-map {
		position: relative;
		width: 100%;
		aspect-ratio: 2/1;
		min-height: 240px;
		background: var(--surface-2);
		border: 1px solid var(--line);
		border-radius: 1rem;
		overflow: hidden;
	}
	.world-map svg {
		width: 100%;
		height: 100%;
		position: absolute;
		inset: 0;
	}
	.land {
		fill: none;
		stroke: var(--ink-muted);
		stroke-width: 0.6;
		vector-effect: non-scaling-stroke;
		opacity: 0.55;
	}
	.marker {
		position: absolute;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		border: 2px solid var(--accent-2);
		padding: 0;
		background: var(--paper);
		color: var(--ink);
		font-size: 0.78rem;
		font-weight: 700;
		z-index: 1;
	}
	.marker.glow {
		box-shadow: 0 0 12px 6px
			color-mix(in srgb, var(--accent-2) calc(var(--strength) * 100%), transparent);
	}
	.marker[aria-pressed='true'] {
		outline: 3px solid var(--accent);
		outline-offset: 3px;
		z-index: 2;
	}
	.legend,
	.credit {
		font-size: 0.82rem;
		color: var(--ink-muted);
	}
	.selection {
		padding: 0.75rem;
		background: var(--surface-2);
		border-radius: 0.75rem;
		overflow-wrap: anywhere;
	}
	.selection h2 {
		font-size: 1rem;
	}
	.selection li {
		margin: 0.5rem 0;
	}
	.credit a,
	.selection a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	@media (max-width: 520px) {
		.world-map {
			aspect-ratio: 1.4/1;
		}
		.controls {
			font-size: 0.85rem;
		}
	}
</style>
