<script lang="ts">
	type Point = { crag: string; lat: number; lon: number; count: number };

	let { points = [] }: { points?: Point[] } = $props();

	const pad = 28;
	const width = 640;
	const height = 360;

	const bounds = $derived.by(() => {
		if (points.length === 0) {
			return { minLon: -180, maxLon: 180, minLat: -60, maxLat: 75 };
		}
		let minLon = Infinity;
		let maxLon = -Infinity;
		let minLat = Infinity;
		let maxLat = -Infinity;
		for (const p of points) {
			minLon = Math.min(minLon, p.lon);
			maxLon = Math.max(maxLon, p.lon);
			minLat = Math.min(minLat, p.lat);
			maxLat = Math.max(maxLat, p.lat);
		}
		const lonPad = Math.max(2, (maxLon - minLon) * 0.12 || 5);
		const latPad = Math.max(2, (maxLat - minLat) * 0.12 || 5);
		return {
			minLon: minLon - lonPad,
			maxLon: maxLon + lonPad,
			minLat: Math.max(-85, minLat - latPad),
			maxLat: Math.min(85, maxLat + latPad)
		};
	});

	const maxCount = $derived(Math.max(1, ...points.map((p) => p.count)));

	function xOf(lon: number) {
		const { minLon, maxLon } = bounds;
		const span = maxLon - minLon || 1;
		return pad + ((lon - minLon) / span) * (width - pad * 2);
	}

	function yOf(lat: number) {
		const { minLat, maxLat } = bounds;
		const span = maxLat - minLat || 1;
		return pad + ((maxLat - lat) / span) * (height - pad * 2);
	}

	function rOf(count: number) {
		return 5 + (Math.sqrt(count) / Math.sqrt(maxCount)) * 14;
	}
</script>

{#if points.length === 0}
	<p class="empty">No crag coordinates yet — sync from theCrag API after the geo migration.</p>
{:else}
	<svg class="map" viewBox="0 0 {width} {height}" role="img" aria-label="Crag map of climbed areas">
		<rect class="bg" x="0" y="0" {width} {height} rx="12" />
		{#each points as p (p.crag)}
			{@const cx = xOf(p.lon)}
			{@const cy = yOf(p.lat)}
			{@const r = rOf(p.count)}
			<a href="/logbook?crag={encodeURIComponent(p.crag)}">
				<title>{p.crag} · {p.count} ascents</title>
				<circle class="dot" {cx} {cy} {r} />
				<text class="label" x={cx} y={cy - r - 4} text-anchor="middle">{p.crag}</text>
			</a>
		{/each}
	</svg>
{/if}

<style>
	.map {
		width: 100%;
		height: auto;
		display: block;
	}
	.bg {
		fill: color-mix(in srgb, var(--accent) 6%, transparent);
		stroke: var(--line);
	}
	.dot {
		fill: color-mix(in srgb, var(--style-sport) 55%, transparent);
		stroke: var(--style-sport);
		stroke-width: 1.5;
	}
	a:hover .dot {
		fill: color-mix(in srgb, var(--accent) 65%, transparent);
		stroke: var(--accent);
	}
	.label {
		font-size: 10px;
		font-weight: 600;
		fill: var(--ink-muted);
		pointer-events: none;
	}
	.empty {
		color: var(--ink-muted);
		font-size: 0.9rem;
		margin: 0;
	}
</style>
