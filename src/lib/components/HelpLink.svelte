<script lang="ts">
	type Props = {
		href: string;
		/** Accessible name and tooltip, e.g. "How climber profile works". */
		label: string;
	};

	let { href, label }: Props = $props();
</script>

<a class="help" {href} aria-label={label} title={label}>?</a>

<style>
	.help {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--surface-2);
		color: var(--ink-muted);
		font-size: 0.78rem;
		font-weight: 700;
		line-height: 1;
		text-decoration: none;
		flex: 0 0 auto;
	}
	.help:hover {
		color: var(--ink);
		border-color: color-mix(in srgb, var(--accent) 45%, var(--line));
	}
</style>
