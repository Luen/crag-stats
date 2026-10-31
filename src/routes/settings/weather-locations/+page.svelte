<script lang="ts">
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Weather locations · Crag Stats</title></svelte:head>
<section class="panel">
	<h1>Weather locations</h1>
	<p><a href="/settings">Back to Settings</a> · <a href="/docs/weather">How weather works</a></p>
	<p>
		Route points take priority, then crag points, then immediate sector points. Validated small area
		polygons supply an approximate boundary coordinate when these points are missing. Country
		centres are excluded when the original payload identifies them. Without a usable point, choose a
		nearby town as an approximate weather location. Polygon and town fallbacks do not move route
		maps or unlock weather badges. Existing weather stays cached, but only the current location's
		key is used.
	</p>
	<p>
		Search sends only the place name and country code you enter to Open-Meteo/GeoNames when you
		submit. No ascent details or private notes are sent. Results are cached for 30 days; no place is
		selected automatically.
	</p>
	{#if form?.message}<p role="status">{form.message}</p>{/if}
	{#if form?.candidates}<section aria-label="Place search results">
			<h2>Choose the correct place</h2>
			{#if !form.candidates.length}<p>
					No matching places. Try a nearby town with its region.
				</p>{/if}
			<ul>
				{#each form.candidates as p (p.id)}<li>
						{p.name} · {p.admin} · {p.country} ({p.lat}, {p.lon}){p.elevation != null
							? ` · ${p.elevation} m`
							: ''}
						<form method="POST" action="?/choose">
							<input type="hidden" name="areaKey" value={form.areaKey} /><input
								type="hidden"
								name="queryKey"
								value={form.queryKey}
							/><input type="hidden" name="id" value={p.id} /><button type="submit"
								>Use {p.name} as an approximate weather place</button
							>
						</form>
					</li>{/each}
			</ul>
		</section>{/if}
	<h2>Outdoor climbing areas</h2>
	<p>
		{data.groups.reduce((n, g) => n + g.unresolved, 0)} routes have unresolved weather locations.
	</p>
	{#each data.groups as g (g.key)}<details>
			<summary
				>{g.name} · {g.country ?? 'Country unknown'} · {g.unresolved}/{g.routes} unresolved routes · {g.source}</summary
			>{#if g.override}<p>
					Chosen fallback: {g.override.name}. Precise route/crag points still take priority.
				</p>
				<form method="POST" action="?/clear">
					<input type="hidden" name="areaKey" value={g.key} /><button type="submit"
						>Remove nearby-place fallback</button
					>
				</form>{/if}
			<form method="POST" action="?/search" class="search">
				<input type="hidden" name="areaKey" value={g.key} /><label
					>Nearby place or town <input
						name="query"
						required
						minlength="3"
						maxlength="100"
						placeholder="Town, region"
					/></label
				><label
					>Country code <input
						name="countryCode"
						required
						pattern={'[A-Za-z]{2}'}
						maxlength="2"
						placeholder="AU"
					/></label
				><button type="submit">Search places for {g.name}</button>
			</form>
		</details>{/each}
</section>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h1 {
		font-size: 1.5rem;
	}
	h2 {
		font-size: 1.1rem;
	}
	p {
		color: var(--ink-muted);
	}
	details {
		padding: 0.7rem 0;
		border-top: 1px solid var(--line);
	}
	summary {
		cursor: pointer;
		overflow-wrap: anywhere;
	}
	.search {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.7rem;
		margin: 0.8rem 0;
	}
	label {
		display: grid;
		gap: 0.3rem;
	}
	input,
	button {
		font: inherit;
		color: var(--ink);
		background: var(--paper);
		border: 1px solid var(--line);
		padding: 0.4rem 0.6rem;
		border-radius: 0.4rem;
		max-width: 100%;
	}
	button {
		cursor: pointer;
	}
	a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	li {
		margin: 1rem 0;
		overflow-wrap: anywhere;
	}
</style>
