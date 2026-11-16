<script lang="ts">
	import { useI18n } from '#lib/i18n';

	let { pct, horizon }: { pct: number | null; horizon: string } = $props();
	const i18n = useI18n();

	const HORIZON_KEYS: Record<string, string> = {
		Sent: 'cards.projectReadiness.horizonSent',
		'Unknown grade': 'cards.projectReadiness.horizonUnknownGrade',
		'Short-term': 'cards.projectReadiness.horizonShortTerm',
		Medium: 'cards.projectReadiness.horizonMedium',
		'Long-haul': 'cards.projectReadiness.horizonLongHaul'
	};

	const horizonLabel = $derived(HORIZON_KEYS[horizon] ? i18n.t(HORIZON_KEYS[horizon]) : horizon);
</script>

<div class="readiness">
	<div class="label">
		<span
			>{pct === 100
				? i18n.t('cards.projectReadiness.sent')
				: i18n.t('cards.projectReadiness.approximate')}</span
		>
		<strong>{pct == null ? i18n.t('cards.projectReadiness.noGradeData') : `${pct}%`}</strong>
	</div>
	{#if pct != null}
		<progress
			max="100"
			value={pct}
			aria-label={i18n.t('cards.projectReadiness.ariaApproximateProjectReadiness')}>{pct}%</progress
		>
	{/if}
	{#if pct !== 100}<span class="horizon"
			>{horizonLabel} · {i18n.t('cards.projectReadiness.estimateNote')}</span
		>{/if}
</div>

<style>
	.readiness {
		margin-top: 0.65rem;
	}
	.label {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.4rem;
		font-size: 0.8rem;
		color: var(--ink);
	}
	progress {
		display: block;
		width: 100%;
		height: 0.5rem;
		margin: 0.4rem 0;
		appearance: none;
		border: 0;
		border-radius: 999px;
		overflow: hidden;
		background: var(--surface-3);
	}
	progress::-webkit-progress-bar {
		background: var(--surface-3);
	}
	progress::-webkit-progress-value {
		background: var(--accent);
		border-radius: 999px;
	}
	progress::-moz-progress-bar {
		background: var(--accent);
		border-radius: 999px;
	}
	.horizon {
		font-size: 0.75rem;
		color: var(--ink-muted);
	}
</style>
