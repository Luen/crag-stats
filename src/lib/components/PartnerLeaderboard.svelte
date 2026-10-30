<script lang="ts">
	import { onMount } from 'svelte';
	import {
		EMPTY_CARD_PREFERENCES,
		migrateCardPreference,
		saveCardPreference,
		type CardPreferences
	} from '#lib/cardPreferences';
	import {
		PARTNER_METRICS,
		partnerMetricLabel,
		partnerMetricValue,
		sortPartners,
		type PartnerMetric,
		type PartnerStat
	} from '#lib/partnerStats';

	type Props = {
		preferences?: CardPreferences;
		partners: PartnerStat[];
		/** When set, the card title links here (dashboard → full list). */
		titleHref?: string | null;
		/** Ascents / Sessions / Areas toggle (Partners page). */
		metricToggle?: boolean;
		limit?: number;
		compact?: boolean;
	};
	let {
		preferences = EMPTY_CARD_PREFERENCES,
		partners,
		titleHref = null,
		metricToggle = false,
		limit,
		compact = false
	}: Props = $props();

	const METRIC_KEY = 'cs_partners_metric';

	let metric = $derived<PartnerMetric>(
		metricToggle ? (preferences.cs_partners_metric ?? 'ascents') : 'ascents'
	);

	let ready = $state(false);
	onMount(() => {
		if (metricToggle)
			metric = migrateCardPreference('cs_partners_metric', preferences.cs_partners_metric);
		ready = true;
	});

	function setMetric(next: PartnerMetric) {
		metric = next;
		saveCardPreference(METRIC_KEY, next);
	}

	const ranked = $derived(sortPartners(partners, metric).slice(0, limit));
	const max = $derived(Math.max(1, ...ranked.map((p) => partnerMetricValue(p, metric))));

	const metricButtonLabel = (m: PartnerMetric): string => {
		if (m === 'sessions') return 'Sessions';
		if (m === 'areas') return 'Areas';
		return 'Ascents';
	};

	const hint = $derived(
		metric === 'sessions'
			? 'A session is a calendar day with at least one shared ascent.'
			: metric === 'areas'
				? 'Areas are distinct crags (blank or Unknown venues are skipped).'
				: 'Counts every logged ascent that names that partner.'
	);
</script>

<article
	class={[
		'panel',
		{ compact },
		{
			'card-preference-pending':
				!ready && !(!metricToggle || preferences.cs_partners_metric != null)
		}
	]}
>
	<header>
		<div class="titles">
			<h2>
				{#if titleHref}
					<a class="title-link" href={titleHref}>Partners</a>
				{:else}
					Partners
				{/if}
			</h2>
			{#if metricToggle}
				<a class="how" href="/docs/partners">How it works</a>
			{/if}
		</div>
		{#if metricToggle}
			<div class="toggles" role="group" aria-label="Partner count metric">
				{#each PARTNER_METRICS as m (m)}
					<button
						type="button"
						class={{ active: metric === m }}
						aria-pressed={metric === m}
						onclick={() => setMetric(m)}>{metricButtonLabel(m)}</button
					>
				{/each}
			</div>
		{/if}
	</header>

	{#if ranked.length === 0}
		<p class="empty">No partners recorded yet.</p>
	{:else}
		<ul class="bars">
			{#each ranked as p (p.name)}
				{@const value = partnerMetricValue(p, metric)}
				<li>
					<div class="row">
						<a class="label" href={`/logbook?partnerMatch=exact&with=${encodeURIComponent(p.name)}`}
							>{p.name}</a
						>
						<span class="value"
							>{value}
							{#if metricToggle}<span class="unit">{partnerMetricLabel(metric, value)}</span>{/if}
						</span>
					</div>
					<div class="track">
						<div class="fill" style:width="{(value / max) * 100}%"></div>
					</div>
				</li>
			{/each}
		</ul>
		{#if metricToggle}
			<p class="hint">{hint}</p>
		{/if}
	{/if}
</article>

<style>
	.compact .toggles {
		flex-wrap: wrap;
		gap: 0.2rem;
	}
	.compact .toggles button {
		padding: 0.25rem 0.4rem;
		font-size: 0.74rem;
	}
	.compact .hint {
		font-size: 0.74rem;
	}

	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.65rem 1rem;
		margin-bottom: 0.75rem;
	}
	.titles {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.55rem 0.85rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.title-link {
		color: inherit;
		text-decoration: none;
	}
	.title-link:hover {
		color: var(--accent);
	}
	.how {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--accent);
	}
	.toggles {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.toggles button {
		font: inherit;
		font-size: 0.85rem;
		padding: 0.3rem 0.65rem;
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		background: var(--paper);
		color: var(--ink-muted);
		cursor: pointer;
	}
	.toggles button.active {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
	}
	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.7rem;
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.92rem;
	}
	.label {
		font-weight: 600;
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.value {
		color: var(--ink-muted);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.unit {
		font-size: 0.85em;
	}
	.track {
		height: 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
		overflow: hidden;
		margin-top: 0.25rem;
	}
	.fill {
		height: 100%;
		border-radius: inherit;
		background: var(--accent);
		transition: width 400ms ease;
	}
	.hint,
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
	.hint {
		margin-top: 0.75rem;
		font-size: 0.82rem;
	}
</style>
