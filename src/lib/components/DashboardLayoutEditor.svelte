<script lang="ts">
	import {
		DEFAULT_DASH_CARDS,
		cardDef,
		defaultLayout,
		moveLayoutItem,
		type DashLayoutItem
	} from '#lib/dashboardLayout';

	type Props = {
		layout: DashLayoutItem[];
	};

	let { layout }: Props = $props();

	let open = $state(false);
	let draft = $state<DashLayoutItem[]>(defaultLayout());

	function openEditor() {
		draft = structuredClone(layout);
		open = true;
	}

	function closeEditor() {
		open = false;
	}

	function togglePanel() {
		if (open) closeEditor();
		else openEditor();
	}

	function toggle(id: DashLayoutItem['id']) {
		draft = draft.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i));
	}

	function move(id: DashLayoutItem['id'], dir: -1 | 1) {
		draft = moveLayoutItem(draft, id, dir);
	}

	function resetDraft() {
		draft = defaultLayout();
	}

	const visibleCount = $derived(draft.filter((d) => d.enabled).length);
</script>

<section class="editor panel">
	<button type="button" class="toggle" onclick={togglePanel} aria-expanded={open}>
		<span>Customize dashboard</span>
		<span class="chev">{open ? '▾' : '▸'}</span>
	</button>

	{#if open}
		<p class="hint">
			Choose which cards to show and their order (like Dreeve). Hero and summary metrics stay fixed.
			Saved in your browser cookie.
		</p>
		<form method="POST" action="?/setDashboardLayout" class="form">
			<input type="hidden" name="layout" value={JSON.stringify(draft)} />
			<ul>
				{#each draft as item, index (item.id)}
					<li>
						<label class="en">
							<input type="checkbox" checked={item.enabled} onchange={() => toggle(item.id)} />
							<span>{cardDef(item.id).label}</span>
							<em>{cardDef(item.id).width}</em>
						</label>
						<div class="movers">
							<button
								type="button"
								class="icon"
								disabled={index === 0}
								onclick={() => move(item.id, -1)}
								aria-label="Move {cardDef(item.id).label} up">↑</button
							>
							<button
								type="button"
								class="icon"
								disabled={index === draft.length - 1}
								onclick={() => move(item.id, 1)}
								aria-label="Move {cardDef(item.id).label} down">↓</button
							>
						</div>
					</li>
				{/each}
			</ul>
			<div class="actions">
				<button type="submit">Save layout</button>
				<button type="button" class="secondary" onclick={resetDraft}>Reset draft</button>
			</div>
		</form>
		<form method="POST" action="?/resetDashboardLayout" class="reset-form">
			<button type="submit" class="secondary">Clear saved layout</button>
		</form>
		<p class="meta">{DEFAULT_DASH_CARDS.length} cards · {visibleCount} visible</p>
	{/if}
</section>

<style>
	.editor {
		padding: 0.65rem 1rem;
		border-radius: 1rem;
		margin-bottom: 1rem;
	}
	.toggle {
		display: flex;
		width: 100%;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		background: none;
		border: none;
		font: inherit;
		font-weight: 700;
		color: var(--ink);
		cursor: pointer;
		padding: 0.35rem 0;
	}
	.chev {
		color: var(--ink-muted);
	}
	.hint,
	.meta {
		margin: 0.35rem 0 0.75rem;
		color: var(--ink-muted);
		font-size: 0.88rem;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.35rem;
		max-height: 22rem;
		overflow: auto;
	}
	li {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		align-items: center;
		padding: 0.35rem 0.45rem;
		border: 1px solid var(--line);
		border-radius: 0.45rem;
		background: color-mix(in srgb, var(--paper, #fffaf2) 60%, white);
	}
	.en {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		min-width: 0;
		flex: 1;
		font-size: 0.9rem;
		font-weight: 600;
	}
	.en em {
		font-style: normal;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--ink-muted);
		text-transform: uppercase;
		margin-left: auto;
		padding-right: 0.35rem;
	}
	.movers {
		display: flex;
		gap: 0.2rem;
	}
	.icon {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.35rem;
		border: 1px solid var(--line);
		background: white;
		cursor: pointer;
		font: inherit;
		line-height: 1;
	}
	.icon:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.actions,
	.reset-form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-top: 0.75rem;
	}
	.actions button,
	.reset-form button {
		font: inherit;
		font-weight: 700;
		padding: 0.4rem 0.75rem;
		border-radius: 0.45rem;
		border: 1px solid transparent;
		background: var(--accent);
		color: white;
		cursor: pointer;
	}
	.actions .secondary,
	.reset-form .secondary {
		background: transparent;
		border-color: var(--line);
		color: var(--ink);
	}
</style>
