<script lang="ts">
	/**
	 * Marks a project on a route with no grade on theCrag: usually a new line the climber
	 * bolted or is still working. theCrag's API has no "project" flag, so this is a guess.
	 */
	const TITLE = "Ungraded on theCrag, so probably a new route you're bolting or working";
</script>

<span class="new-route" title={TITLE}>
	<!-- Bolt hanger. -->
	<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
		<path
			d="M8 1.5a3.5 3.5 0 0 1 3.5 3.5v1.2l1.9 6.1a1.3 1.3 0 0 1-1.25 1.7h-8.3a1.3 1.3 0 0 1-1.25-1.7l1.9-6.1V5A3.5 3.5 0 0 1 8 1.5Z"
			style="fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linejoin: round"
		/>
		<circle cx="8" cy="5" r="1.3" style="fill: currentColor" />
		<circle cx="8" cy="10.8" r="1.6" style="fill: none; stroke: currentColor; stroke-width: 1.3" />
	</svg>
	<span>New route?</span>
	<span class="sr-only">{TITLE}</span>
</span>

<style>
	.new-route {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.05rem 0.45rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--accent-2) 45%, transparent);
		background: color-mix(in srgb, var(--accent-2) 12%, var(--paper));
		color: var(--ink);
		font-size: 0.72rem;
		font-weight: 600;
		white-space: nowrap;
		vertical-align: middle;
	}
	svg {
		color: var(--accent-2);
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
</style>
