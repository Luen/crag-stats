<script lang="ts">
	import { bandById, getBandName } from '#lib/grades';
	import { useI18n } from '#lib/i18n';

	type Props = {
		grade: string | null | undefined;
		band?: number | null;
	};

	let { grade, band = null }: Props = $props();
	const i18n = useI18n();

	const meta = $derived(bandById(band ?? 0));
	const label = $derived(grade?.trim() || '—');
</script>

<span
	class="grade-chip"
	style:--chip={meta?.color ?? 'var(--style-unknown)'}
	title={meta ? getBandName(meta, i18n.locale) : i18n.t('cards.gradeChip.unknownBand')}
>
	{#if meta}
		<span class="dot" style:background={meta.color}></span>
	{/if}
	{label}
</span>

<style>
	.dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--ink) 12%, transparent);
	}
</style>
