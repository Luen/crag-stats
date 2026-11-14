<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import { styleBadgeColor } from '#lib/ticks';

	type Props = { style: string | null | undefined };
	let { style }: Props = $props();
	const i18n = useI18n();

	const STYLE_KEYS: Record<string, string> = {
		sport: 'styles.sport',
		trad: 'styles.trad',
		boulder: 'styles.boulder',
		'top rope': 'styles.toprope',
		toprope: 'styles.toprope',
		alpine: 'styles.alpine',
		aid: 'styles.aid',
		unknown: 'styles.unknown'
	};

	const rawLabel = $derived((style || '').trim() || 'Unknown');
	const color = $derived(styleBadgeColor(rawLabel));
	const label = $derived.by(() => {
		const key = STYLE_KEYS[rawLabel.toLowerCase()];
		return key ? i18n.t(key) : rawLabel;
	});
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
