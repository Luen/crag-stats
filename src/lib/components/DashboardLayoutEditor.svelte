<script lang="ts">
	import { useI18n } from '#lib/i18n';
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
	const i18n = useI18n();

	// Editable copy of the saved layout; resets when a save reloads `layout`.
	let draft = $derived(structuredClone(layout));

	function toggle(id: DashLayoutItem['id']) {
		draft = draft.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i));
	}

	function move(id: DashLayoutItem['id'], dir: -1 | 1) {
		draft = moveLayoutItem(draft, id, dir);
	}

	function resetDraft() {
		draft = defaultLayout();
	}

	const WIDTH_KEYS = {
		full: 'cards.dashboardLayoutEditor.widthFull',
		half: 'cards.dashboardLayoutEditor.widthHalf',
		quarter: 'cards.dashboardLayoutEditor.widthQuarter'
	} as const;

	const cardLabel = (id: DashLayoutItem['id']) => i18n.t(cardDef(id).labelKey);

	const visibleCount = $derived(draft.filter((d) => d.enabled).length);
</script>

<div class="editor">
	<p class="hint">{i18n.t('cards.dashboardLayoutEditor.hint')}</p>
	<form method="POST" action="?/saveDashboardLayout" class="form">
		<input type="hidden" name="layout" value={JSON.stringify(draft)} />
		<ul>
			{#each draft as item, index (item.id)}
				<li>
					<label class="en">
						<input type="checkbox" checked={item.enabled} onchange={() => toggle(item.id)} />
						<span>{cardLabel(item.id)}</span>
						<em>{i18n.t(WIDTH_KEYS[cardDef(item.id).width])}</em>
					</label>
					<div class="movers">
						<button
							type="button"
							class="icon"
							disabled={index === 0}
							onclick={() => move(item.id, -1)}
							aria-label={i18n.t('cards.dashboardLayoutEditor.ariaMoveUp', {
								name: cardLabel(item.id)
							})}
						>
							↑
						</button>
						<button
							type="button"
							class="icon"
							disabled={index === draft.length - 1}
							onclick={() => move(item.id, 1)}
							aria-label={i18n.t('cards.dashboardLayoutEditor.ariaMoveDown', {
								name: cardLabel(item.id)
							})}
						>
							↓
						</button>
					</div>
				</li>
			{/each}
		</ul>
		<div class="actions">
			<button type="submit">{i18n.t('cards.dashboardLayoutEditor.buttonSaveLayout')}</button>
			<button type="button" class="secondary" onclick={resetDraft}>
				{i18n.t('cards.dashboardLayoutEditor.buttonResetDraft')}
			</button>
		</div>
	</form>
	<form method="POST" action="?/resetDashboardLayout" class="reset-form">
		<button type="submit" class="secondary">
			{i18n.t('cards.dashboardLayoutEditor.buttonClearSavedLayout')}
		</button>
	</form>
	<p class="meta">
		{i18n.t('cards.dashboardLayoutEditor.metaCardsVisible', {
			cards: DEFAULT_DASH_CARDS.length,
			visible: visibleCount
		})}
	</p>
</div>

<style>
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
		background: var(--surface-2);
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
		background: var(--paper);
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
		color: var(--on-accent);
		cursor: pointer;
	}
	.actions .secondary,
	.reset-form .secondary {
		background: transparent;
		border-color: var(--line);
		color: var(--ink);
	}
</style>
