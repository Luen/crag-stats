<script lang="ts">
	import type { ProjectPublicBeta } from '#lib/routeBeta';

	type Props = { beta: ProjectPublicBeta };
	let { beta }: Props = $props();

	const showAttribution = $derived(
		Boolean(beta.attributionUrl && (beta.descriptionExcerpt || beta.accessWarning))
	);
</script>

{#if beta.accessWarning}
	<p class="access" role="note">
		<span class="access-label">Access</span>
		{beta.accessWarning}
	</p>
{/if}

{#if beta.descriptionExcerpt}
	<p class="desc">{beta.descriptionExcerpt}</p>
{/if}

{#if showAttribution}
	<p class="attrib">
		Guidebook text from
		<a href={beta.attributionUrl} target="_blank" rel="noreferrer">theCrag</a>
		<span class="license">(CC BY-SA)</span>
	</p>
{/if}

<style>
	.access {
		margin: 0.15rem 0 0;
		padding: 0.45rem 0.55rem;
		border-radius: 0.55rem;
		border: 1px solid color-mix(in srgb, var(--danger) 35%, var(--line));
		background: color-mix(in srgb, var(--danger) 12%, var(--paper));
		color: var(--ink);
		font-size: 0.82rem;
		line-height: 1.35;
	}
	.access-label {
		display: block;
		margin-bottom: 0.1rem;
		font-size: 0.68rem;
		font-weight: 750;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: color-mix(in srgb, var(--danger) 85%, var(--ink));
	}
	.desc {
		margin: 0.25rem 0 0;
		color: var(--ink-muted);
		font-size: 0.86rem;
		line-height: 1.4;
	}
	.attrib {
		margin: 0.2rem 0 0;
		color: var(--ink-muted);
		font-size: 0.72rem;
		line-height: 1.35;
	}
	.attrib a {
		color: var(--accent);
		font-weight: 600;
		text-decoration: none;
	}
	.attrib a:hover {
		text-decoration: underline;
		text-underline-offset: 0.12em;
	}
	.license {
		white-space: nowrap;
	}
</style>
