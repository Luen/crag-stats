<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
	const i18n = useI18n();
</script>

<svelte:head><title>{i18n.t('pages.weatherLocations.pageTitle')}</title></svelte:head>
<section class="panel">
	<h1>{i18n.t('pages.weatherLocations.titleWeatherLocations')}</h1>
	<p>
		<a href="/settings">{i18n.t('pages.weatherLocations.linkBackToSettings')}</a> ·
		<a href="/docs/weather">{i18n.t('pages.settings.linkHowWeatherWorks')}</a>
	</p>
	<p>
		{i18n.t('pages.weatherLocations.leadLocationPriority')}
	</p>
	<p>
		{i18n.t('pages.weatherLocations.leadSearchPrivacy')}
	</p>
	{#if form?.message}<p role="status">{form.message}</p>{/if}
	{#if form?.candidates}<section
			aria-label={i18n.t('pages.weatherLocations.ariaPlaceSearchResults')}
		>
			<h2>{i18n.t('pages.weatherLocations.titleChooseTheCorrectPlace')}</h2>
			{#if !form.candidates.length}<p>
					{i18n.t('pages.weatherLocations.emptyNoMatchingPlaces')}
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
								>{i18n.t('pages.weatherLocations.buttonUsePlace', { name: p.name })}</button
							>
						</form>
					</li>{/each}
			</ul>
		</section>{/if}
	<h2>{i18n.t('pages.weatherLocations.titleOutdoorClimbingAreas')}</h2>
	<p>
		{i18n.t('pages.weatherLocations.labelUnresolvedRoutes', {
			count: data.groups.reduce((n, g) => n + g.unresolved, 0)
		})}
	</p>
	{#each data.groups as g (g.key)}<details>
			<summary
				>{i18n.t('pages.weatherLocations.summaryArea', {
					name: g.name,
					country: g.country ?? i18n.t('pages.weatherLocations.labelCountryUnknown'),
					unresolved: g.unresolved,
					routes: g.routes,
					source: g.source
				})}</summary
			>{#if g.override}<p>
					{i18n.t('pages.weatherLocations.labelChosenFallback', { name: g.override.name })}
				</p>
				<form method="POST" action="?/clear">
					<input type="hidden" name="areaKey" value={g.key} /><button type="submit"
						>{i18n.t('pages.weatherLocations.buttonRemoveNearbyPlaceFallback')}</button
					>
				</form>{/if}
			<form method="POST" action="?/search" class="search">
				<input type="hidden" name="areaKey" value={g.key} /><label
					>{i18n.t('pages.weatherLocations.labelNearbyPlaceOrTown')}
					<input
						name="query"
						required
						minlength="3"
						maxlength="100"
						placeholder={i18n.t('pages.weatherLocations.placeholderTownRegion')}
					/></label
				><label
					>{i18n.t('pages.weatherLocations.labelCountryCode')}
					<input
						name="countryCode"
						required
						pattern={'[A-Za-z]{2}'}
						maxlength="2"
						placeholder={i18n.t('pages.weatherLocations.placeholderAU')}
					/></label
				><button type="submit"
					>{i18n.t('pages.weatherLocations.buttonSearchPlacesForArea', { name: g.name })}</button
				>
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
