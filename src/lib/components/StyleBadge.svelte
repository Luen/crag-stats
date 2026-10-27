<script lang="ts">
	import { styleBadgeColor } from '#lib/ticks';

	type Props = { style: string | null | undefined };
	let { style }: Props = $props();

	const label = $derived((style || '').trim() || 'Unknown');
	const color = $derived(styleBadgeColor(label));
</script>

<span class="badge" style:--badge={color}>{label}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.12rem 0.45rem;
		border-radius: 0.35rem;
		border: 1.5px solid var(--badge);
		/* Mixed toward ink: darker in light mode, lighter in dark mode (AA contrast). */
		color: color-mix(in srgb, var(--badge) 55%, var(--ink));
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.01em;
		line-height: 1.2;
		white-space: nowrap;
		background: color-mix(in srgb, var(--badge) 8%, transparent);
	}
</style>
