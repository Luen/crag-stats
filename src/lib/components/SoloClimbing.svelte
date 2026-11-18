<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import GradeChip from '#lib/components/GradeChip.svelte';
	import type { SoloStats } from '#lib/types/dashboard';

	type Props = { data: SoloStats };
	let { data }: Props = $props();
	const i18n = useI18n();

	const year = (d: string | null) => (d ? d.slice(0, 4) : null);
	const unpartneredPct = $derived(
		data.totalAscents ? Math.round((data.unpartnered / data.totalAscents) * 100) : 0
	);

	const SOLO_KIND_KEYS: Record<string, string> = {
		toprope: 'cards.soloClimbing.kindToprope',
		lead: 'cards.soloClimbing.kindLead',
		free: 'cards.soloClimbing.kindFree',
		dws: 'cards.soloClimbing.kindDws'
	};

	function kindLabel(kind: string, fallback: string): string {
		const key = SOLO_KIND_KEYS[kind];
		return key ? i18n.t(key) : fallback;
	}
</script>

<article class="panel">
	<h2>{i18n.t('cards.soloClimbing.titleSoloClimbing')}</h2>
	{#if data.total === 0}
		<p class="empty">{i18n.t('cards.soloClimbing.empty')}</p>
	{:else}
		<ul class="kinds">
			{#each data.kinds as k (k.kind)}
				{@const label = kindLabel(k.kind, k.label)}
				<li>
					<div class="head">
						<a
							class="kind-link"
							href={`/logbook?solo=${k.kind}`}
							aria-label={i18n.t('cards.soloClimbing.ariaViewClimbsInLogbook', {
								kind: label
							})}
						>
							<strong>{label}</strong>
						</a>
						<span class="count">{k.count}</span>
					</div>
					<p class="meta">
						{i18n.t('cards.soloClimbing.unitSends', { count: k.sends })}
						{#if k.first}
							· {year(k.first) === year(k.latest)
								? year(k.first)
								: `${year(k.first)}–${year(k.latest)}`}
						{/if}
					</p>
					{#if k.hardest}
						<p class="hardest">
							<span class="label">{i18n.t('cards.soloClimbing.labelHardest')}</span>
							{#if k.hardest.url}
								<a href={k.hardest.url} target="_blank" rel="noreferrer">{k.hardest.routeName}</a>
							{:else}
								{k.hardest.routeName}
							{/if}
							<GradeChip grade={k.hardest.gradeLabel} band={k.hardest.band} />
						</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
	<p class="foot">
		<strong>{data.unpartnered}</strong>
		{i18n.t('cards.soloClimbing.footNoPartner', {
			ascents: data.unpartnered,
			sends: data.unpartneredSends,
			percent: unpartneredPct
		})}
		<a class="how" href="/docs/solo">{i18n.t('common.howItWorks')}</a>
	</p>
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	.empty {
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.kinds {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: 0.55rem;
	}
	.kinds li {
		position: relative;
		border: 1px solid var(--line);
		border-top: 3px solid var(--accent-2);
		border-radius: 0.65rem;
		padding: 0.7rem 0.75rem;
		background: var(--paper);
	}
	.kind-link {
		color: inherit;
		text-decoration: none;
	}
	.kind-link::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 0.65rem;
	}
	.kind-link:focus-visible {
		outline: none;
	}
	.kind-link:focus-visible::after {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
	.kinds li:hover {
		border-color: var(--accent-2);
		background: var(--surface-2);
	}
	.hardest a {
		position: relative;
		z-index: 1;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.5rem;
	}
	.count {
		font-family: var(--font-display);
		font-size: 1.45rem;
		font-weight: 700;
		line-height: 1;
	}
	.meta {
		margin: 0.25rem 0 0;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
	.hardest {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
	}
	.hardest .label {
		color: var(--ink-muted);
	}
	.hardest a,
	.foot a {
		text-decoration: underline;
	}
	.foot {
		margin: 0.8rem 0 0;
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	.foot strong {
		color: var(--ink);
	}
</style>
