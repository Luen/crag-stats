<script lang="ts">
	type RockType = { name: string; count: number; pct: number };
	type Info = { name: string; summary: string; tips: string };

	type Props = {
		types: RockType[];
		dominant: string | null;
		info: Info | null;
	};

	let { types, dominant, info }: Props = $props();

	const max = $derived(Math.max(1, ...types.map((t) => t.count)));
</script>

<article class="panel">
	<h2>Rock types</h2>

	{#if types.length === 0}
		<p class="empty">No rock type data yet.</p>
	{:else}
		<ul class="bars">
			{#each types as t (t.name)}
				<li>
					<div class="row">
						<span class={['label', { dom: dominant === t.name }]}>{t.name}</span>
						<span class="value">{t.count} · {Math.round(t.pct)}%</span>
					</div>
					<div class="track">
						<div class="fill" style:width="{(t.count / max) * 100}%"></div>
					</div>
				</li>
			{/each}
		</ul>

		{#if info}
			<div class="blurb">
				<strong>{info.name}</strong>
				<p>{info.summary}</p>
				{#if info.tips}
					<p class="tips">{info.tips}</p>
				{/if}
			</div>
		{:else if dominant}
			<p class="foot">Dominant rock: <strong>{dominant}</strong></p>
		{/if}
	{/if}
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.7rem;
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.92rem;
	}
	.label {
		font-weight: 600;
	}
	.label.dom {
		color: var(--accent);
	}
	.value {
		color: var(--ink-muted);
	}
	.track {
		height: 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
		overflow: hidden;
		margin-top: 0.25rem;
	}
	.fill {
		height: 100%;
		border-radius: inherit;
		background: var(--accent);
		transition: width 400ms ease;
	}
	.blurb {
		margin-top: 1rem;
		padding-top: 0.85rem;
		border-top: 1px solid var(--line);
	}
	.blurb strong {
		font-size: 0.95rem;
	}
	.blurb p {
		margin: 0.35rem 0 0;
		color: var(--ink-muted);
		font-size: 0.88rem;
		line-height: 1.45;
	}
	.tips {
		font-style: italic;
	}
	.foot {
		margin: 0.85rem 0 0;
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	.foot strong {
		color: var(--ink);
	}
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
</style>
