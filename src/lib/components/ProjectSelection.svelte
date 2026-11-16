<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import { enhance } from '$app/forms';
	let {
		provider,
		route,
		name,
		decision = 'auto',
		action = '/projects?/selection'
	}: {
		provider: string;
		route: string;
		name: string;
		decision?: string;
		action?: string;
	} = $props();
	const i18n = useI18n();
</script>

<form
	method="POST"
	{action}
	class="project-selection"
	aria-label="Project selection for {name}"
	use:enhance
>
	<input type="hidden" name="provider" value={provider} />
	<input type="hidden" name="route" value={route} />
	{#if decision === 'include'}
		<span class="mark">{i18n.t('cards.projectSelection.labelProject')}</span>
		<button type="submit" name="decision" value="exclude" aria-label="Unmark project: {name}"
			>Unmark project</button
		>
	{:else}
		{#if decision === 'exclude'}<span class="dismissed"
				>{i18n.t('cards.projectSelection.labelNotAProject')}</span
			>{/if}
		<button type="submit" name="decision" value="include" aria-label="Mark project: {name}"
			>Mark project</button
		>
		{#if decision === 'auto'}<button
				type="submit"
				name="decision"
				value="exclude"
				aria-label="Not a project: {name}">Not a project</button
			>{/if}
	{/if}
	{#if decision !== 'auto'}<button
			type="submit"
			name="decision"
			value="auto"
			aria-label="Use automatic project detection for {name}">Use automatic</button
		>{/if}
</form>

<style>
	.project-selection {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.3rem;
		margin-top: 0.3rem;
	}
	button,
	.mark,
	.dismissed {
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--paper);
		color: var(--ink-muted);
		padding: 0.05rem 0.4rem;
		font: inherit;
		font-size: 0.72rem;
	}
	button {
		cursor: pointer;
	}
	button:hover {
		border-color: var(--accent);
		color: var(--ink);
	}
	.mark {
		border-color: var(--accent);
		color: var(--ink);
		background: var(--accent-soft);
		font-weight: 650;
	}
</style>
