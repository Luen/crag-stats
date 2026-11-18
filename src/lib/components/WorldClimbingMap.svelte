<script lang="ts">
	import { useI18n } from '#lib/i18n';
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
	import RichText from './RichText.svelte';
	let {
		places,
		dateDisplay = DEFAULT_DATE_DISPLAY
	}: { places: ClimbingPlace[]; dateDisplay?: DateDisplay } = $props();
	const i18n = useI18n();
	const centre = $derived(longitudeCentre(places));
	let customView = $state<MapView | null>(null);
	const view = $derived(customView ?? fitMapPlaces(places, centre));
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
	const label = (c: (typeof clusters)[number]) => {
		const ascents = formatNumber(c.count, dateDisplay);
		return c.places.length === 1
			? i18n.t('cards.worldClimbingMap.labelMarkerSingle', { place: c.places[0].name, ascents })
			: i18n.t('cards.worldClimbingMap.labelMarkerCluster', {
					places: c.places.length,
					ascents
				});
	};
</script>

<div class="controls">
	<div role="group" aria-label={i18n.t('cards.worldClimbingMap.ariaMapNavigation')}>
		<button
			type="button"
			onclick={() => zoom(0.6)}
			aria-label={i18n.t('cards.worldClimbingMap.ariaZoomIn')}
		>
			+
		</button><button
			type="button"
			onclick={() => zoom(1 / 0.6)}
			aria-label={i18n.t('cards.worldClimbingMap.ariaZoomOut')}
		>
			−
		</button>
		<button
			type="button"
			onclick={() => pan(-1, 0)}
			aria-label={i18n.t('cards.worldClimbingMap.ariaPanWest')}
		>
			←
		</button><button
			type="button"
			onclick={() => pan(1, 0)}
			aria-label={i18n.t('cards.worldClimbingMap.ariaPanEast')}
		>
			→
		</button><button
			type="button"
			onclick={() => pan(0, -1)}
			aria-label={i18n.t('cards.worldClimbingMap.ariaPanNorth')}
		>
			↑
		</button><button
			type="button"
			onclick={() => pan(0, 1)}
			aria-label={i18n.t('cards.worldClimbingMap.ariaPanSouth')}
		>
			↓
		</button>
		<button
			type="button"
			onclick={() => {
				customView = null;
				selectedKey = null;
			}}
		>
			{i18n.t('cards.worldClimbingMap.buttonFitPlaces')}
		</button><button
			type="button"
			onclick={() => {
				customView = { x: 0, y: 0, width: 1000, height: 500 };
				selectedKey = null;
			}}
		>
			{i18n.t('cards.worldClimbingMap.buttonWorld')}
		</button>
	</div>
</div>
<div
	class="world-map"
	role="group"
	aria-label={i18n.t('cards.worldClimbingMap.ariaWorldwideClimbingPlaces')}
>
	<svg
		viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
		preserveAspectRatio="none"
		aria-hidden="true"
	>
		<path class="land" d={outline} />
	</svg>
	{#each clusters as c (c.key)}
		{@const size = 28 + 24 * Math.sqrt(c.count / max)}
		<button
			type="button"
			class="marker glow"
			style:left={`${((c.x - view.x) / view.width) * 100}%`}
			style:top={`${((c.y - view.y) / view.height) * 100}%`}
			style:width={`${size}px`}
			style:height={`${size}px`}
			style:--strength={0.25 + (0.65 * c.count) / max}
			aria-label={label(c)}
			aria-pressed={selectedKey === c.key}
			onclick={() => (selectedKey = selectedKey === c.key ? null : c.key)}
			title={label(c)}
		>
			{formatNumber(c.count, dateDisplay)}
		</button>
	{/each}
</div>
<p class="legend">
	{i18n.t('cards.worldClimbingMap.legend')}
</p>
{#if selected}
	<section
		class="selection"
		aria-label={i18n.t('cards.worldClimbingMap.ariaSelectedMapPlaces')}
		aria-live="polite"
	>
		<h2>{label(selected)}</h2>
		{#if selected.places.length > 1}<button
				type="button"
				onclick={() => {
					// Small floor so close places separate; the spread padding keeps all of them in view.
					customView = fitMapPlaces(selected.places, centre, 8);
					selectedKey = null;
				}}
			>
				{i18n.t('cards.worldClimbingMap.buttonZoomToThesePlaces')}
			</button>{/if}
		<ul>
			{#each selected.places as p (p.key)}<li>
					<a href={p.href}>
						{i18n.t('cards.worldClimbingMap.linkPlaceAscents', {
							name: p.name,
							country: p.country ? ` · ${p.country}` : '',
							ascents: formatNumber(p.count, dateDisplay)
						})}
					</a>
					· {i18n.t('cards.worldClimbingMap.metaRoutesAndDates', {
						routes: p.routes,
						first: p.firstDay
							? formatCalendarDate(p.firstDay, dateDisplay)
							: i18n.t('cards.worldClimbingMap.labelDateUnknown'),
						last: p.lastDay
							? formatCalendarDate(p.lastDay, dateDisplay)
							: i18n.t('cards.worldClimbingMap.labelDateUnknownLower')
					})}
				</li>{/each}
		</ul>
	</section>
{/if}
<p class="credit">
	<RichText
		message={i18n.t('cards.worldClimbingMap.credit')}
		tokens={{
			naturalEarth: {
				kind: 'link',
				text: i18n.t('cards.worldClimbingMap.linkNaturalEarth'),
				href: 'https://www.naturalearthdata.com/about/terms-of-use/',
				external: true
			}
		}}
	/>
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
	.credit :global(a),
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
