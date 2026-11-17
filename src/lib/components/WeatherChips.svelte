<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import { DEFAULT_DATE_DISPLAY, formatNumber, type DateDisplay } from '#lib/dates';
	import type { WeatherChip, WeatherLocation } from '#lib/weatherKeys';
	import {
		DEFAULT_DISPLAY_UNITS,
		formatPrecipitation,
		formatTemperature,
		formatWind,
		type DisplayUnits
	} from '#lib/units';

	type Props = {
		location?: WeatherLocation | null;
		chips?: WeatherChip[] | null;
		dateDisplay?: DateDisplay;
		displayUnits?: DisplayUnits;
	};
	let {
		location = null,
		chips = [],
		dateDisplay = DEFAULT_DATE_DISPLAY,
		displayUnits = DEFAULT_DISPLAY_UNITS
	}: Props = $props();
	const i18n = useI18n();

	function label(chip: WeatherChip): string {
		if (chip.value == null || chip.unit == null) return chip.name;
		if (chip.unit === '°C') {
			return `${chip.name} ${formatTemperature(chip.value, displayUnits.temperature)}`;
		}
		if (chip.unit === 'km/h') {
			return `${chip.name} ${formatWind(chip.value, displayUnits.wind)}`;
		}
		if (chip.unit === 'mm') {
			return `${chip.name} ${formatPrecipitation(chip.value, displayUnits.precipitation)}`;
		}
		const sep = ' ';
		return `${chip.name} ${formatNumber(chip.value, dateDisplay)}${sep}${chip.unit}`;
	}
</script>

{#if chips && chips.length}
	<ul class="weather-chips" aria-label={i18n.t('cards.weatherChips.ariaWeatherOnTheDay')}>
		{#each chips as chip (chip.key)}
			<li class="chip {chip.key}" title={i18n.t('cards.weatherChips.titleWeatherOnTheDayOpen')}>
				{label(chip)}
			</li>
		{/each}
	</ul>
{/if}

{#if location && location.source !== 'route'}<p class="location">
		{i18n.t('cards.weatherChips.locationSource', {
			source:
				location.source === 'place'
					? i18n.t('pages.logbook.weatherSourcePlace')
					: location.source === 'polygon'
						? i18n.t('pages.logbook.weatherSourcePolygon')
						: location.source === 'cached'
							? i18n.t('pages.logbook.weatherSourceCached')
							: i18n.t('pages.logbook.weatherSourceCrag'),
			name: location.name
		})}
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
