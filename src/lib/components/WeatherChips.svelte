<script lang="ts">
	import { DEFAULT_DATE_DISPLAY, formatNumber, type DateDisplay } from '#lib/dates';
	import type { WeatherChip, WeatherLocation } from '#lib/weatherKeys';

	type Props = {
		location?: WeatherLocation | null;
		chips?: WeatherChip[] | null;
		dateDisplay?: DateDisplay;
	};
	let { location = null, chips = [], dateDisplay = DEFAULT_DATE_DISPLAY }: Props = $props();

	function label(chip: WeatherChip): string {
		if (chip.value == null || chip.unit == null) return chip.name;
		const sep = chip.unit === '°C' ? '' : ' ';
		return `${chip.name} ${formatNumber(chip.value, dateDisplay)}${sep}${chip.unit}`;
	}
</script>

{#if chips && chips.length}
	<ul class="weather-chips" aria-label="Weather on the day">
		{#each chips as chip (chip.key)}
			<li class="chip {chip.key}" title="Weather on the day (Open-Meteo)">{label(chip)}</li>
		{/each}
	</ul>
{/if}

{#if location && location.source !== 'route'}<p class="location">
		Weather location: {location.source === 'place'
			? 'Approximate nearby place'
			: location.source === 'polygon'
				? 'Approximate area polygon'
				: location.source === 'cached'
					? 'Cached point'
					: 'Approximate crag/sector'} · {location.name}
	</p>{/if}

<style>
	.location {
		font-size: 0.75rem;
		color: var(--ink-muted);
		margin: 0.25rem 0;
		overflow-wrap: anywhere;
	}

	.weather-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin: 0.25rem 0 0;
		padding: 0;
		list-style: none;
	}
	.chip {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		padding: 0.1rem 0.4rem;
		border-radius: 0.35rem;
		color: var(--ink);
		background: color-mix(in srgb, var(--chip-tone, var(--ink-muted)) 14%, var(--paper));
		border: 1px solid color-mix(in srgb, var(--chip-tone, var(--ink-muted)) 45%, transparent);
	}
	.heat {
		--chip-tone: var(--accent);
	}
	.freeze {
		--chip-tone: var(--style-boulder);
	}
	.rain {
		--chip-tone: var(--style-sport);
	}
	.snow {
		--chip-tone: var(--style-toprope);
	}
	.wind {
		--chip-tone: var(--style-alpine);
	}
	.fair {
		--chip-tone: var(--accent-2);
	}
</style>
