<script lang="ts">
	import { bandById } from '#lib/grades';

	type Props = {
		grade: string | null | undefined;
		band?: number | null;
	};

	let { grade, band = null }: Props = $props();

	const meta = $derived(bandById(band ?? 0));
	const label = $derived(grade?.trim() || '—');
</script>

<span
	class="grade-chip"
	style:--chip={meta?.color ?? '#8a8a8a'}
	title={meta?.name ?? 'Unknown band'}
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
		box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12);
	}
</style>
