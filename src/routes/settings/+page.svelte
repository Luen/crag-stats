<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import { onMount, untrack } from 'svelte';
	import DashboardLayoutEditor from '#lib/components/DashboardLayoutEditor.svelte';
	import RichText from '#lib/components/RichText.svelte';
	import { DATE_FORMAT_OPTIONS, formatDateTime } from '#lib/dates';
	import { BOULDER_GRADE_SYSTEMS, ROUTE_GRADE_SYSTEMS } from '#lib/grades';
	import TickTypeIcon from '#lib/components/TickTypeIcon.svelte';
	import {
		groupTicksByCategory,
		applyPresetToState,
		detectCurrentPreset,
		tickDisplayName,
		unrenderedChoices,
		type TickBehavior,
		type TickPreset
	} from '#lib/tickSettings';
	import {
		DISTANCE_UNIT_OPTIONS,
		HEIGHT_UNIT_OPTIONS,
		PRECIPITATION_UNIT_OPTIONS,
		TEMPERATURE_UNIT_OPTIONS,
		UNIT_PRESETS,
		WIND_UNIT_OPTIONS,
		type DistanceUnit,
		type HeightUnit,
		type PrecipitationUnit,
		type TemperatureUnit,
		type WindUnit
	} from '#lib/units';
	import {
		freshestSnapshot,
		IMPORT_PROGRESS_POLL_MS,
		importsRunning,
		type ImportProgressSnapshot
	} from '#lib/importProgress';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	// Seed from SSR data so the selects render the stored choice without JS.
	let unitHeight = $state<HeightUnit>(untrack(() => data.displayUnits.height));
	let unitDistance = $state<DistanceUnit>(untrack(() => data.displayUnits.distance));
	let unitTemperature = $state<TemperatureUnit>(untrack(() => data.displayUnits.temperature));
	let unitWind = $state<WindUnit>(untrack(() => data.displayUnits.wind));
	let unitPrecipitation = $state<PrecipitationUnit>(untrack(() => data.displayUnits.precipitation));

	$effect(() => {
		unitHeight = data.displayUnits.height;
		unitDistance = data.displayUnits.distance;
		unitTemperature = data.displayUnits.temperature;
		unitWind = data.displayUnits.wind;
		unitPrecipitation = data.displayUnits.precipitation;
	});

	function applyUnitPreset(presetId: string) {
		const preset = UNIT_PRESETS.find((p) => p.id === presetId);
		if (!preset) return;
		unitHeight = preset.units.height;
		unitDistance = preset.units.distance;
		unitTemperature = preset.units.temperature;
		unitWind = preset.units.wind;
		unitPrecipitation = preset.units.precipitation;
	}

	const importResult = $derived(
		form?.result?.skipped === false
			? form.result
			: form?.imported != null
				? { count: form.imported, created: form.created, pruned: null }
				: null
	);
	type ImportSnapshot = ImportProgressSnapshot<
		PageProps['data']['routeHistory'],
		PageProps['data']['weatherImport']
	>;
	let polled = $state<ImportSnapshot | null>(null);
	const progress = $derived(
		freshestSnapshot(
			{
				serverNow: data.serverNow,
				routeHistory: data.routeHistory,
				weatherImport: data.weatherImport
			},
			polled
		)
	);
	const rh = $derived(progress.routeHistory);
	const wx = $derived(progress.weatherImport);
	const polling = $derived(importsRunning(progress));
	let elapsed = $state(0);
	const retrySeconds = $derived(
		Math.max(0, Math.ceil((rh.retryAt - progress.serverNow - elapsed) / 1000))
	);
	const weatherRetrySeconds = $derived(
		Math.max(0, Math.ceil((wx.retryAt - progress.serverNow - elapsed) / 1000))
	);

	// While a run is active, re-read the local counts so they climb as each item is saved.
	$effect(() => {
		if (!polling) return;
		let stopped = false;
		const timer = setInterval(async () => {
			if (document.hidden) return;
			try {
				const res = await fetch('/settings/import-status', {
					headers: { accept: 'application/json' }
				});
				if (!res.ok || stopped) return;
				const next = (await res.json()) as ImportSnapshot;
				if (!stopped) polled = next;
			} catch {
				// Keep the last counts; the next tick tries again.
			}
		}, IMPORT_PROGRESS_POLL_MS);
		return () => {
			stopped = true;
			clearInterval(timer);
		};
	});
	function formatRetry(seconds: number): string {
		if (seconds >= 3600)
			return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`;
		if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
		return `${seconds}s`;
	}
	const retryLabel = $derived(formatRetry(retrySeconds));
	const weatherRetryLabel = $derived(formatRetry(weatherRetrySeconds));

	let tickOverrides = $state<Record<string, TickBehavior>>({});
	const tickState = $derived<Record<string, TickBehavior>>({
		...data.tickSettings,
		...tickOverrides
	});
	const groupedTicks = $derived(groupTicksByCategory(data.availableTicks));
	const currentPreset = $derived(detectCurrentPreset(tickState, data.availableTicks));
	// Stored choices for ticks without a rendered radio (no logged rows yet). They must
	// still reach the server on save, so a preset can clear them instead of persisting.
	const storedWithoutRadio = $derived(
		Object.entries(tickState).filter(([key]) => !data.availableTicks.some((t) => t.key === key))
	);
	// The same leftovers, surfaced as a note: the matrix renders the standard tick types
	// plus provider names that have logged rows, so a saved non-Enable choice for any
	// other tick type is otherwise invisible while it keeps applying to future climbs (#476).
	const leftoverChoices = $derived(unrenderedChoices(tickState, data.availableTicks));
	const leftoverLabel = $derived(
		leftoverChoices
			.map(([key, behavior]) => `${tickDisplayName(key)} (${behaviorLabel(behavior)})`)
			.join(', ')
	);
	function behaviorLabel(behavior: Exclude<TickBehavior, 'enable'>): string {
		return behavior === 'projects_goals'
			? i18n.t('pages.settings.thProjectsGoals')
			: i18n.t('pages.settings.thHide');
	}

	function applyPreset(preset: TickPreset) {
		tickOverrides = applyPresetToState(preset, data.tickSettings, data.availableTicks);
	}

	function setTick(key: string, behavior: TickBehavior) {
		tickOverrides = { ...tickOverrides, [key]: behavior };
	}

	onMount(() => {
		// Anchor to the server's clock so a skewed device clock cannot skip the cooldown.
		// Tick once per second so the accessible name does not chatter.
		let serverNow = progress.serverNow;
		let started = performance.now();
		const timer = setInterval(() => {
			if (serverNow !== progress.serverNow) {
				serverNow = progress.serverNow;
				started = performance.now();
			}
			elapsed = performance.now() - started;
		}, 1000);
		return () => clearInterval(timer);
	});
</script>

<section class="panel head">
	<h1>{i18n.t('pages.settings.titleSettings')}</h1>
	<p>{i18n.t('pages.settings.hintIntro')}</p>
</section>

{#if form?.routeHistoryWaiting}
	<p class="banner hint">
		{retrySeconds > 0
			? i18n.t('pages.settings.bannerRouteDataWaiting', { when: retryLabel })
			: i18n.t('pages.settings.bannerRouteDataReady')}
	</p>
{:else if form?.weatherWaiting}
	<p class="banner hint">
		{weatherRetrySeconds > 0
			? i18n.t('pages.settings.bannerWeatherWaiting', { when: weatherRetryLabel })
			: i18n.t('pages.settings.bannerWeatherReady')}
	</p>
{:else if form?.message}
	<p class="banner err">{form.message}</p>
{:else if form?.layoutSaved}
	<p class="banner ok">
		{i18n.t('pages.settings.bannerDashboardLayoutSaved')}
		<a href="/">{i18n.t('pages.settings.linkViewDashboard')}</a>
	</p>
{:else if form?.saved}
	<p class="banner ok">{i18n.t('pages.settings.bannerPreferencesSaved')}</p>
{:else if form?.routeHistoryMessage}
	<p class="banner ok">{form.routeHistoryMessage}</p>
{:else if form?.weatherMessage}
	<p class="banner ok">{form.weatherMessage}</p>
{:else if form?.result?.skipped}
	<p class="banner hint" role="status">{form.result.reason}</p>
{:else if importResult}
	<div class="banner ok" role="status" aria-label={i18n.t('pages.settings.ariaImportSummary')}>
		<strong
			>{importResult.pruned
				? i18n.t('pages.settings.bannerSyncComplete')
				: i18n.t('pages.settings.bannerCsvComplete')}</strong
		>
		<p>{i18n.t('pages.settings.summaryProcessed', { count: importResult.count })}</p>
		<ul>
			<li>{i18n.t('pages.settings.summaryNewRoutes', { count: importResult.created.routes })}</li>
			<li>{i18n.t('pages.settings.summaryNewAscents', { count: importResult.created.ascents })}</li>
			<li>
				{i18n.t('pages.settings.summaryRefreshedAscents', {
					count: importResult.count - importResult.created.ascents
				})}
			</li>
			{#if importResult.pruned}
				<li>
					{i18n.t('pages.settings.summaryRemovedAscents', {
						count: importResult.pruned.deletedAscents
					})}
				</li>
				<li>
					{i18n.t('pages.settings.summaryRemovedRoutes', {
						count: importResult.pruned.deletedRoutes
					})}
				</li>
			{/if}
		</ul>
		<p class="summary-note">
			{importResult.pruned
				? i18n.t('pages.settings.bannerImportsRunSeparately')
				: i18n.t('pages.settings.bannerCsvDoesNotRemove')}
		</p>
	</div>
{:else if form?.ok}
	<p class="banner ok">{i18n.t('pages.settings.bannerDone')}</p>
{/if}

<section class="grid">
	<article class="panel">
		<h2>{i18n.t('pages.settings.titleDisplayVisibility')}</h2>
		<p class="hint">
			{i18n.t('pages.settings.hintDatesAreDisplayOnly')}
			<a href="/docs/display-settings">{i18n.t('pages.settings.linkHowDisplaySettingsWork')}</a>
		</p>
		<form method="POST" action="?/savePreferences" class="prefs">
			<label class="field">
				<span>{i18n.t('pages.settings.labelLanguage')}</span>
				<select name="locale">
					<option value="" selected={!data.siteLocale}
						>{i18n.t('pages.settings.optionAutoBrowserLanguage')}</option
					>
					{#each data.supportedLocales as loc (loc)}
						<option value={loc} selected={data.siteLocale === loc}>
							{data.localeMetadata[loc].nativeName} ({data.localeMetadata[loc].name})
						</option>
					{/each}
				</select>
				<small class="hint">
					{i18n.t('pages.settings.hintLanguage')}
				</small>
			</label>
			<label class="field">
				<span>{i18n.t('pages.settings.labelRouteGrades')}</span>
				<select name="routeSystem">
					{#each ROUTE_GRADE_SYSTEMS as opt (opt.id)}
						<option value={opt.id} selected={data.gradeSystems.route === opt.id}>{opt.label}</option
						>
					{/each}
				</select>
				<small class="hint">{i18n.t('pages.settings.hintRouteGrades')}</small>
			</label>
			<label class="field">
				<span>{i18n.t('pages.settings.labelBoulderGrades')}</span>
				<select name="boulderSystem">
					{#each BOULDER_GRADE_SYSTEMS as opt (opt.id)}
						<option value={opt.id} selected={data.gradeSystems.boulder === opt.id}
							>{opt.label}</option
						>
					{/each}
				</select>
				<small class="hint">{i18n.t('pages.settings.hintBoulderGrades')}</small>
			</label>
			<label class="field">
				<span>{i18n.t('pages.settings.labelDateFormat')}</span>
				<select name="dateFormat">
					{#each DATE_FORMAT_OPTIONS as opt (opt.id)}
						<option value={opt.id} selected={data.dateFormat === opt.id}>{opt.label}</option>
					{/each}
				</select>
				<small class="hint">{i18n.t('pages.settings.hintDateFormat')}</small>
			</label>
			<h3 class="subheading">{i18n.t('pages.settings.labelUnitsOfMeasurement')}</h3>
			<div class="presets-row">
				<span>{i18n.t('pages.settings.labelPresets')}</span>
				{#each UNIT_PRESETS as preset (preset.id)}
					<button
						type="button"
						class="preset-btn"
						title={preset.description}
						onclick={() => applyUnitPreset(preset.id)}
					>
						{preset.label}
					</button>
				{/each}
			</div>
			<label class="field">
				<span>{i18n.t('pages.settings.labelHeight')}</span>
				<select name="unitHeight" bind:value={unitHeight}>
					{#each HEIGHT_UNIT_OPTIONS as opt (opt.id)}
						<option value={opt.id}>{opt.label}</option>
					{/each}
				</select>
				<small class="hint">{i18n.t('pages.settings.hintHeight')}</small>
			</label>
			<label class="field">
				<span>{i18n.t('pages.settings.labelDistance')}</span>
				<select name="unitDistance" bind:value={unitDistance}>
					{#each DISTANCE_UNIT_OPTIONS as opt (opt.id)}
						<option value={opt.id}>{opt.label}</option>
					{/each}
				</select>
				<small class="hint">{i18n.t('pages.settings.hintDistance')}</small>
			</label>
			<label class="field">
				<span>{i18n.t('pages.settings.labelTemperature')}</span>
				<select name="unitTemperature" bind:value={unitTemperature}>
					{#each TEMPERATURE_UNIT_OPTIONS as opt (opt.id)}
						<option value={opt.id}>{opt.label}</option>
					{/each}
				</select>
				<small class="hint">{i18n.t('pages.settings.hintTemperature')}</small>
			</label>
			<label class="field">
				<span>{i18n.t('pages.settings.labelWindSpeed')}</span>
				<select name="unitWind" bind:value={unitWind}>
					{#each WIND_UNIT_OPTIONS as opt (opt.id)}
						<option value={opt.id}>{opt.label}</option>
					{/each}
				</select>
				<small class="hint">{i18n.t('pages.settings.hintWindSpeed')}</small>
			</label>
			<label class="field">
				<span>{i18n.t('pages.settings.labelPrecipitation')}</span>
				<select name="unitPrecipitation" bind:value={unitPrecipitation}>
					{#each PRECIPITATION_UNIT_OPTIONS as opt (opt.id)}
						<option value={opt.id}>{opt.label}</option>
					{/each}
				</select>
				<small class="hint">{i18n.t('pages.settings.hintPrecipitation')}</small>
			</label>
			<label class="check">
				<input
					type="checkbox"
					name="indexing"
					checked={data.searchIndexing.allowed}
					disabled={data.searchIndexing.forcedOff}
				/>
				<span>
					<strong>{i18n.t('pages.settings.titleShowInSearchEngines')}</strong>
					<small class="hint">
						{#if data.searchIndexing.forcedOff}
							<RichText
								message={i18n.t('pages.settings.hintSearchIndexingForcedOff')}
								tokens={{ authScope: { kind: 'code', text: 'AUTH_SCOPE=all' } }}
							/>
						{:else}
							<RichText
								message={i18n.t('pages.settings.hintSearchIndexing')}
								tokens={{
									robots: { kind: 'code', text: 'robots.txt' },
									noindex: { kind: 'code', text: 'noindex' },
									xRobotsTag: { kind: 'code', text: 'X-Robots-Tag' }
								}}
							/>
						{/if}
					</small>
				</span>
			</label>
			<label class="check">
				<input type="checkbox" name="notes" checked={data.showNotes.enabled} />
				<span>
					<strong>{i18n.t('pages.settings.titleShowPrivateNotes')}</strong>
					<small class="hint">
						{i18n.t('pages.settings.hintNotes')}
						{#if data.authEnabled}
							{i18n.t('pages.settings.hintNotesSignedIn')}
						{:else}
							<RichText
								message={i18n.t('pages.settings.hintNotesNoPassword')}
								tokens={{ appPassword: { kind: 'code', text: 'APP_PASSWORD' } }}
							/>
							{i18n.t('pages.settings.hintNotesNoPasswordTail')}
						{/if}
					</small>
				</span>
			</label>
			<fieldset class="field tick-config">
				<legend class="field-title">
					<span>{i18n.t('pages.settings.titleCountedTickTypes')}</span>
					<small class="hint">
						{i18n.t('pages.settings.hintCountedTickTypes')}
					</small>
				</legend>
				<div
					class="preset-bar"
					role="group"
					aria-label={i18n.t('pages.settings.ariaTickConfigurationPresets')}
				>
					<span class="preset-label">{i18n.t('pages.settings.labelPresets')}</span>
					<button
						type="button"
						class="btn secondary sm"
						class:active={currentPreset === 'all'}
						aria-pressed={currentPreset === 'all'}
						onclick={() => applyPreset('all')}
						>{i18n.t('pages.settings.buttonAllLoggedTicks')}</button
					>
					<button
						type="button"
						class="btn secondary sm"
						class:active={currentPreset === 'sends_only'}
						aria-pressed={currentPreset === 'sends_only'}
						onclick={() => applyPreset('sends_only')}
						>{i18n.t('pages.settings.buttonSendsOnly')}</button
					>
					<button
						type="button"
						class="btn secondary sm"
						class:active={currentPreset === 'exclude_working'}
						aria-pressed={currentPreset === 'exclude_working'}
						onclick={() => applyPreset('exclude_working')}
						>{i18n.t('pages.settings.buttonExcludeWorking')}</button
					>
				</div>
				<div class="table-wrap">
					<table class="tick-matrix">
						<thead>
							<tr>
								<th scope="col">{i18n.t('pages.settings.columnTickType')}</th>
								<th scope="col" class="center">
									<div class="col-head">
										<span>{i18n.t('pages.settings.thEnable')}</span>
										<small class="col-desc">{i18n.t('pages.settings.hintColumnEnable')}</small>
									</div>
								</th>
								<th scope="col" class="center">
									<div class="col-head">
										<span>{i18n.t('pages.settings.thProjectsGoals')}</span>
										<small class="col-desc"
											>{i18n.t('pages.settings.hintColumnProjectsGoals')}</small
										>
									</div>
								</th>
								<th scope="col" class="center">
									<div class="col-head">
										<span>{i18n.t('pages.settings.thHide')}</span>
										<small class="col-desc">{i18n.t('pages.settings.hintColumnHide')}</small>
									</div>
								</th>
							</tr>
						</thead>
						<tbody>
							{#each groupedTicks as group (group.name)}
								<tr class="group-header">
									<td colspan="4">
										<strong>{group.name}</strong>
									</td>
								</tr>
								{#each group.ticks as tick (tick.key)}
									<tr>
										<th scope="row" class="tick-name-cell">
											<div class="tick-info">
												<TickTypeIcon tick={tick.name} label={false} />
												<span class="tick-name">{tick.name}</span>
												{#if tick.count != null && tick.count > 0}
													<span class="tick-count">({tick.count})</span>
												{/if}
											</div>
										</th>
										<td class="center">
											<label class="radio-cell">
												<input
													type="radio"
													name={`tick_${tick.key}`}
													value="enable"
													checked={(tickState[tick.key] ?? 'enable') === 'enable'}
													onchange={() => setTick(tick.key, 'enable')}
													aria-label={i18n.t('pages.settings.ariaTickEnable', {
														name: tick.name
													})}
												/>
											</label>
										</td>
										<td class="center">
											<label class="radio-cell">
												<input
													type="radio"
													name={`tick_${tick.key}`}
													value="projects_goals"
													checked={tickState[tick.key] === 'projects_goals'}
													onchange={() => setTick(tick.key, 'projects_goals')}
													aria-label={i18n.t('pages.settings.ariaTickProjectsGoals', {
														name: tick.name
													})}
												/>
											</label>
										</td>
										<td class="center">
											<label class="radio-cell">
												<input
													type="radio"
													name={`tick_${tick.key}`}
													value="hide"
													checked={tickState[tick.key] === 'hide'}
													onchange={() => setTick(tick.key, 'hide')}
													aria-label={i18n.t('pages.settings.ariaTickHide', {
														name: tick.name
													})}
												/>
											</label>
										</td>
									</tr>
								{/each}
							{/each}
						</tbody>
					</table>
				</div>
				{#if leftoverChoices.length > 0}
					<p class="hint tick-leftovers">
						<RichText
							message={i18n.t('pages.settings.hintTickLeftovers')}
							tokens={{
								leftover: { kind: 'strong', text: leftoverLabel },
								allTicks: {
									kind: 'strong',
									text: i18n.t('pages.settings.buttonAllLoggedTicks')
								}
							}}
						/>
					</p>
				{/if}
			</fieldset>
			{#each storedWithoutRadio as [key, behavior] (key)}
				<input type="hidden" name={`tick_${key}`} value={behavior} />
			{/each}
			<button type="submit">{i18n.t('pages.settings.buttonSavePreferences')}</button>
		</form>
	</article>

	<article class="panel" id="dashboard">
		<h2>{i18n.t('pages.settings.titleDashboardLayout')}</h2>
		<DashboardLayoutEditor layout={data.dashLayout} />
	</article>

	<article class="panel">
		<h2>{i18n.t('pages.settings.titleCSVImport')}</h2>
		<p class="hint">
			<RichText
				message={i18n.t('pages.settings.hintCsvImport')}
				tokens={{
					action: { kind: 'em', text: i18n.t('pages.settings.csvExportAction') },
					syncOptions: {
						kind: 'link',
						text: i18n.t('pages.settings.linkLogbookSyncOptions'),
						href: '/docs/logbook-sync'
					}
				}}
			/>
		</p>
		<form method="POST" action="?/importCsv" enctype="multipart/form-data" class="csv-import">
			<input
				type="file"
				name="file"
				accept=".csv,text/csv"
				aria-label={i18n.t('pages.settings.ariaTheCragLogbookCsvExport')}
				required
			/>
			<button type="submit">{i18n.t('pages.settings.buttonImportCsv')}</button>
		</form>
	</article>

	<article class="panel">
		<h2>{i18n.t('pages.settings.titleTheCragLogbookSync')}</h2>
		<p class="hint">
			<RichText
				message={i18n.t('pages.settings.hintApiKeyIntro')}
				tokens={{
					key: { kind: 'code', text: 'THECRAG_API_KEY' },
					docs: {
						kind: 'link',
						text: i18n.t('pages.settings.linkApiDocs'),
						href: 'https://www.thecrag.com/en/article/logbookreadapi',
						external: true
					}
				}}
			/>
		</p>
		<p class="hint">
			<RichText message={i18n.t('pages.settings.hintUpstreamSourceOfTruth')} />
		</p>
		<p class="status">
			<span class={['pill', { ok: data.sync.status === 'idle', err: data.sync.status === 'error' }]}
				>{data.sync.status}</span
			>
			{#if data.sync.lastSuccessAt}
				<span
					>{i18n.t('pages.settings.statusLastSync', {
						when: formatDateTime(data.sync.lastSuccessAt, data.dateDisplay)
					})}</span
				>
			{:else}
				<span>{i18n.t('pages.settings.statusNoSyncYet')}</span>
			{/if}
		</p>
		{#if data.sync.lastError}
			<p class="err">{data.sync.lastError}</p>
		{/if}
		{#if data.syncConfiguration.configured}
			<div class="actions">
				<form method="POST" action="?/sync">
					<button type="submit">{i18n.t('pages.settings.buttonSyncNow')}</button>
				</form>
				<form method="POST" action="?/fullSync">
					<button type="submit" class="secondary">{i18n.t('pages.settings.buttonSyncAgain')}</button
					>
				</form>
			</div>
		{:else}
			<p class="hint">
				<RichText
					message={i18n.t('pages.settings.hintNoApiKey')}
					tokens={{
						key: { kind: 'code', text: 'THECRAG_API_KEY' },
						env: { kind: 'code', text: '.env' }
					}}
				/>
			</p>
		{/if}
	</article>

	<article class="panel">
		<h2>{i18n.t('pages.settings.titleImportRouteData')}</h2>
		<p class="hint">
			<RichText
				message={i18n.t('pages.settings.hintRouteDataIntro')}
				tokens={{ login: { kind: 'code', text: '@login' } }}
			/>
			{#if rh.refreshDays}
				{i18n.t('pages.settings.hintRouteDataRefreshCycle', { days: rh.refreshDays })}
			{:else}
				{i18n.t('pages.settings.hintRouteDataFetchOnce')}
			{/if}
			<RichText
				message={i18n.t('pages.settings.hintRouteDataTail', { count: rh.perRun })}
				tokens={{
					docs: {
						kind: 'link',
						text: i18n.t('pages.settings.linkHowFirstAscentsWork'),
						href: '/docs/first-ascents'
					}
				}}
			/>
		</p>
		{#if !rh.enabled}
			<p class="hint">
				<RichText
					message={i18n.t('pages.settings.hintRouteDataDisabled')}
					tokens={{
						import: { kind: 'code', text: 'ROUTE_DATA_IMPORT=true' },
						env: { kind: 'code', text: '.env' },
						impers: { kind: 'code', text: 'impers' },
						oldImport: { kind: 'code', text: 'ROUTE_HISTORY_IMPORT' }
					}}
				/>
			</p>
		{:else if !rh.hasApiKey}
			<p class="hint">
				<RichText
					message={i18n.t('pages.settings.hintRouteDataNeedsKey')}
					tokens={{ key: { kind: 'code', text: 'THECRAG_API_KEY' } }}
				/>
			</p>
		{:else}
			<p class="status">
				<span
					class={[
						'pill',
						{
							ok: rh.status === 'idle' || rh.status === 'running',
							err: rh.status === 'error' || rh.status === 'blocked'
						}
					]}
					aria-live="polite">{rh.status}</span
				>
				<span>
					{i18n.t('pages.settings.statusRoutesChecked', {
						checked: rh.fetchedRoutes,
						total: rh.totalRoutes
					})} · {i18n.t('pages.settings.statusFasImported', { count: rh.importedMarks })}
					{#if rh.pendingAreas > 0}
						· {i18n.t('pages.settings.statusAreasPending', { count: rh.pendingAreas })}{/if}
					{#if rh.lastRunAt}
						· {i18n.t('pages.settings.statusLastRunRoutes', {
							when: formatDateTime(rh.lastRunAt, data.dateDisplay),
							count: rh.lastFetched
						})}
					{/if}
				</span>
			</p>
			{#if rh.nextAllowedAt && (rh.status === 'blocked' || rh.status === 'error')}
				<p class="err">
					{i18n.t('pages.settings.statusPausedUntil', {
						message: rh.lastError ?? '',
						when: formatDateTime(rh.nextAllowedAt, data.dateDisplay)
					})}
				</p>
			{/if}
			<div class="actions">
				<form method="POST" action="?/fetchRouteHistory">
					<button
						type="submit"
						disabled={rh.running ||
							(rh.pendingRoutes === 0 && rh.pendingAreas === 0) ||
							retrySeconds > 0}
					>
						{rh.pendingRoutes === 0 && rh.pendingAreas === 0
							? i18n.t('pages.settings.buttonAllRoutesChecked')
							: rh.running
								? i18n.t('pages.settings.buttonCheckingRoutes')
								: retrySeconds > 0
									? i18n.t('pages.settings.buttonCheckAgainIn', { when: retryLabel })
									: rh.pendingRoutes === 0
										? i18n.t('pages.settings.buttonCheckWeatherLocationsNow')
										: i18n.t('pages.settings.buttonCheckNextRoutes', { count: rh.perRun })}
					</button>
				</form>
			</div>
			<noscript>
				<p class="hint">{i18n.t('pages.settings.hintRouteDataRefresh')}</p>
			</noscript>
			<details>
				<summary>{i18n.t('pages.settings.summary')}</summary>
				<form method="POST" action="?/reapplyRouteHistory" class="stack">
					<p class="hint">{i18n.t('pages.settings.hintReAppliesMarksFromHistory')}</p>
					<label class="check">
						<input type="checkbox" name="replaceExisting" />
						<span>
							<strong>{i18n.t('pages.settings.titleReplaceExistingMarks')}</strong>
							<small class="hint">{i18n.t('pages.settings.hintReplaceExistingMarks')}</small>
						</span>
					</label>
					<label class="check">
						<input type="checkbox" name="reapplyUnmarked" />
						<span>
							<strong>{i18n.t('pages.settings.titleReapplyUnmarked')}</strong>
							<small class="hint">{i18n.t('pages.settings.hintReapplyUnmarked')}</small>
						</span>
					</label>
					<button type="submit" class="secondary"
						>{i18n.t('pages.settings.buttonReApplyFromSavedHistory')}</button
					>
				</form>
				<form method="POST" action="?/refreshRouteHistory" class="stack">
					<p class="hint">
						<RichText
							message={i18n.t('pages.settings.hintRefreshAllRoutes', {
								count: data.routeHistory.perRun
							})}
							tokens={{
								reapply: {
									kind: 'strong',
									text: i18n.t('pages.settings.buttonReApplyFromSavedHistory')
								}
							}}
						/>
					</p>
					<label class="field">
						<span>
							<RichText
								message={i18n.t('pages.settings.labelTypeRefreshToConfirm')}
								tokens={{ refresh: { kind: 'code', text: 'REFRESH' } }}
							/>
						</span>
						<input name="confirm" autocomplete="off" />
					</label>
					<button type="submit" class="secondary"
						>{i18n.t('pages.settings.buttonRefreshAllRoutes')}</button
					>
				</form>
			</details>
		{/if}
	</article>

	<article class="panel">
		<h2>{i18n.t('pages.settings.titleImportWeather')}</h2>
		<p>
			<a href="/settings/weather-locations">{i18n.t('pages.settings.linkReviewWeatherLocations')}</a
			>
		</p>
		<p class="hint">
			<RichText
				message={i18n.t('pages.settings.hintWeatherIntro', { count: wx.perRun })}
				tokens={{
					docs: {
						kind: 'link',
						text: i18n.t('pages.settings.linkHowWeatherWorks'),
						href: '/docs/weather'
					}
				}}
			/>
		</p>
		{#if !wx.enabled}
			<p class="hint">
				<RichText
					message={i18n.t('pages.settings.hintWeatherDisabled')}
					tokens={{
						import: { kind: 'code', text: 'WEATHER_IMPORT=true' },
						env: { kind: 'code', text: '.env' }
					}}
				/>
			</p>
		{:else}
			<p class="status">
				<span
					class={[
						'pill',
						{
							ok: wx.status === 'idle' || wx.status === 'running',
							err: wx.status === 'error' || wx.status === 'blocked'
						}
					]}
					aria-live="polite">{wx.status}</span
				>
				<span>
					{i18n.t('pages.settings.statusDaysCached', { count: wx.cachedOk })} ·
					{i18n.t('pages.settings.statusPending', { count: wx.totalPending })}
					{#if wx.unresolvedRoutes > 0}
						· {i18n.t('pages.settings.statusRoutesWithoutLocations', {
							count: wx.unresolvedRoutes
						})}{/if}
					{#if wx.lastRunAt}
						· {i18n.t('pages.settings.statusLastRunWeather', {
							when: formatDateTime(wx.lastRunAt, data.dateDisplay),
							count: wx.lastFetched
						})}
					{/if}
				</span>
			</p>
			{#if wx.nextAllowedAt && (wx.status === 'blocked' || wx.status === 'error')}
				<p class="err">
					{i18n.t('pages.settings.statusPausedUntil', {
						message: wx.lastError ?? '',
						when: formatDateTime(wx.nextAllowedAt, data.dateDisplay)
					})}
				</p>
			{/if}
			{#if wx.totalPending === 0 && wx.cachedOk === 0}
				<p class="hint">
					{i18n.t('pages.settings.hintWeatherNoDays')}
					{#if wx.unresolvedRoutes > 0}
						<RichText
							message={i18n.t('pages.settings.hintWeatherUnresolved')}
							tokens={{
								review: {
									kind: 'link',
									text: i18n.t('pages.settings.linkReviewMissingLocations'),
									href: '/settings/weather-locations'
								}
							}}
						/>
					{/if}
				</p>
			{/if}
			<div class="actions">
				<form method="POST" action="?/fetchWeather">
					<button
						type="submit"
						disabled={wx.running || wx.totalPending === 0 || weatherRetrySeconds > 0}
					>
						{wx.totalPending === 0
							? wx.cachedOk === 0
								? i18n.t('pages.settings.buttonNoEligibleDays')
								: i18n.t('pages.settings.buttonAllDaysCached')
							: wx.running
								? i18n.t('pages.settings.buttonFetchingWeather')
								: weatherRetrySeconds > 0
									? i18n.t('pages.settings.buttonFetchAgainIn', { when: weatherRetryLabel })
									: i18n.t('pages.settings.buttonFetchNextDays', { count: wx.perRun })}
					</button>
				</form>
			</div>
		{/if}
	</article>

	<article class="panel">
		<h2>{i18n.t('pages.settings.titlePrivacyDataControl')}</h2>
		<p class="hint">
			<RichText
				message={i18n.t('pages.settings.hintPrivacy')}
				tokens={{
					privacy: {
						kind: 'link',
						text: i18n.t('pages.settings.linkPrivacyMd'),
						href: 'https://github.com/Luen/crag-stats/blob/main/docs/PRIVACY.md'
					}
				}}
			/>
		</p>
		<div class="backup">
			<a class="btn secondary" href="/settings/export" download>
				<svg
					viewBox="0 0 24 24"
					width="17"
					height="17"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					><path
						d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
					/></svg
				>
				{i18n.t('pages.settings.buttonDownloadLogbookCsv')}
			</a>
			<small class="hint">{i18n.t('pages.settings.labelBackupReImport')}</small>
		</div>
		<form method="POST" action="?/wipe" class="stack">
			<input
				name="confirm"
				placeholder={i18n.t('pages.settings.placeholderTypeDeleteToConfirm')}
				required
			/>
			<button type="submit" class="danger">{i18n.t('pages.settings.buttonWipeAllLocalData')}</button
			>
		</form>
	</article>

	{#if data.authEnabled && data.authed}
		<article class="panel">
			<h2>{i18n.t('pages.settings.titleAdminSession')}</h2>
			<p class="hint">{i18n.t('pages.settings.hintEndYourSignedInSession')}</p>
			<form method="POST" action="/logout">
				<button type="submit" class="secondary">{i18n.t('pages.settings.buttonLogOut')}</button>
			</form>
		</article>
	{/if}
</section>

<style>
	.head,
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.head {
		margin-bottom: 0.9rem;
	}
	h1,
	h2 {
		margin: 0 0 0.5rem;
	}
	.head p,
	.hint {
		color: var(--ink-muted);
		margin: 0.35rem 0 0.85rem;
	}
	.grid {
		display: grid;
		gap: 0.9rem;
	}
	.prefs {
		display: grid;
		gap: 1rem;
		max-width: 48rem;
	}
	.field {
		display: grid;
		gap: 0.3rem;
	}
	.field > span {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink-muted);
	}
	.field select {
		font: inherit;
		padding: 0.5rem 0.6rem;
		border-radius: 0.55rem;
		border: 1px solid var(--line);
		max-width: 18rem;
	}
	.subheading {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink-muted);
		margin: 0.5rem 0 0;
		border-top: 1px solid var(--line);
		padding-top: 0.75rem;
	}
	.presets-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
	}
	.presets-row > span {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--ink-muted);
	}
	.preset-btn {
		font-size: 0.75rem;
		padding: 0.25rem 0.55rem;
		border-radius: 0.4rem;
		background: var(--surface-2);
		color: var(--ink);
		border: 1px solid var(--line);
		font-weight: 600;
		cursor: pointer;
	}
	.preset-btn:hover {
		background: var(--surface-3);
	}
	.prefs .hint {
		margin: 0;
		font-size: 0.85rem;
	}
	.check {
		display: flex;
		gap: 0.65rem;
		align-items: flex-start;
	}
	.check input {
		margin-top: 0.3rem;
		width: 1.05rem;
		height: 1.05rem;
		accent-color: var(--accent);
	}
	.check span {
		display: grid;
		gap: 0.15rem;
	}
	.status {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		color: var(--ink-muted);
	}
	.pill {
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		background: var(--surface-3);
		color: var(--ink);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
	}
	/* Ink text on tinted pills (#300–#302): the generic .ok/.err rules below must not recolour them (#429). */
	.pill.ok {
		background: color-mix(in srgb, var(--band-beginner) 20%, var(--paper));
		color: var(--ink);
	}
	.pill.err {
		background: color-mix(in srgb, var(--band-expert) 16%, var(--paper));
		color: var(--ink);
	}
	.actions,
	.stack {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}
	.stack {
		flex-direction: column;
		align-items: stretch;
	}
	.csv-import {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		align-items: flex-start;
	}
	.csv-import input[type='file'] {
		width: 100%;
		max-width: 32rem;
		min-width: 0;
		padding: 0.35rem;
		background: var(--paper);
		color: var(--ink-muted);
	}
	.csv-import input::file-selector-button {
		margin-right: 0.75rem;
		padding: 0.45rem 0.7rem;
		border: 1px solid var(--line);
		border-radius: 0.35rem;
		background: var(--surface-2);
		color: var(--ink);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}
	.csv-import input::file-selector-button:hover {
		background: var(--surface-3);
	}
	button,
	.btn,
	input {
		font: inherit;
		padding: 0.55rem 0.8rem;
		border-radius: 0.55rem;
		border: 1px solid var(--line);
	}
	button,
	.btn {
		background: var(--accent);
		color: var(--on-accent);
		border: none;
		font-weight: 700;
		cursor: pointer;
		width: fit-content;
	}
	button:hover,
	.btn:hover {
		background: var(--accent-strong);
	}
	button:disabled,
	button:disabled:hover {
		background: var(--surface-3);
		color: var(--ink-muted);
		cursor: not-allowed;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
	}
	button.secondary,
	.btn.secondary {
		background: var(--paper);
		color: var(--ink);
		border: 1px solid var(--line);
	}
	button.secondary:hover,
	.btn.secondary:hover {
		background: var(--surface-2);
	}
	button.danger {
		background: var(--band-expert);
		color: #fff;
	}
	button.danger:hover {
		background: var(--band-expert);
		filter: brightness(0.9);
	}
	.backup {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.65rem;
		margin-bottom: 1.1rem;
	}
	.backup .hint {
		margin: 0;
	}
	.summary-note {
		font-size: 0.85rem;
	}
	.banner {
		padding: 0.7rem 1rem;
		border-radius: 0.7rem;
		margin-bottom: 0.8rem;
	}
	.ok {
		background: color-mix(in srgb, var(--band-beginner) 18%, var(--paper));
	}
	.err {
		background: color-mix(in srgb, var(--band-expert) 12%, var(--paper));
		/* Pure --band-expert is 2.78:1 on the dark tint; mixing with ink keeps it red and AA in both themes (#429). */
		color: color-mix(in srgb, var(--band-expert) 45%, var(--ink));
	}
	.banner.hint {
		background: var(--accent-soft);
		color: var(--ink);
	}
	.tick-config {
		border: none;
		padding: 0;
		margin: 0.5rem 0 0;
	}
	.tick-leftovers {
		margin: 0.6rem 0 0;
	}
	.field-title {
		display: grid;
		gap: 0.3rem;
		margin-bottom: 0.6rem;
		padding: 0;
	}
	.field-title > span {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--ink-muted);
	}
	.preset-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	.preset-label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--ink-muted);
	}
	.btn.sm {
		padding: 0.3rem 0.6rem;
		font-size: 0.8rem;
		border-radius: 0.4rem;
	}
	.btn.secondary.active {
		background: var(--accent-soft);
		border-color: color-mix(in srgb, var(--accent) 40%, transparent);
		color: var(--accent);
		font-weight: 700;
	}
	.table-wrap {
		overflow-x: auto;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--paper);
	}
	.tick-matrix {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}
	.tick-matrix thead th {
		position: sticky;
		top: 0;
		background: var(--surface-2);
		color: var(--ink);
		padding: 0.6rem 0.65rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-align: left;
		border-bottom: 1px solid var(--line);
	}
	.tick-matrix th.center,
	.tick-matrix td.center {
		text-align: center;
	}
	.col-head {
		display: grid;
		gap: 0.1rem;
		justify-items: center;
	}
	.col-desc {
		font-size: 0.68rem;
		font-weight: 500;
		color: var(--ink-muted);
		text-transform: none;
		letter-spacing: normal;
	}
	.group-header td {
		background: var(--surface-2);
		padding: 0.45rem 0.75rem;
		font-size: 0.75rem;
		color: var(--ink-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-top: 1px solid var(--line);
	}
	.tick-matrix td,
	.tick-matrix tbody th {
		padding: 0.4rem 0.65rem;
		border-top: 1px solid var(--line);
		vertical-align: middle;
		text-align: left;
	}
	.tick-name-cell {
		font-weight: 600;
	}
	.tick-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.tick-name {
		color: var(--ink);
	}
	.tick-count {
		font-size: 0.75rem;
		font-weight: normal;
		color: var(--ink-muted);
	}
	.radio-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 2.2rem;
		cursor: pointer;
	}
	.radio-cell input[type='radio'] {
		width: 1.1rem;
		height: 1.1rem;
		cursor: pointer;
		accent-color: var(--accent);
		margin: 0;
	}
</style>
