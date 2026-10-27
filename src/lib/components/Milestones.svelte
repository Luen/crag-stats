<script lang="ts">
	type Item = {
		kind: string;
		label: string;
		date: string | null;
		detail: string;
	};

	type Props = { items: Item[] };
	let { items }: Props = $props();
</script>

<article class="panel">
	<h2>Milestones</h2>

	{#if items.length === 0}
		<p class="empty">No milestones yet — keep ticking.</p>
	{:else}
		<ul>
			{#each items as item, i (`${item.kind}-${item.label}-${item.detail}-${item.date ?? i}`)}
				<li>
					<span class="kind">{item.kind}</span>
					<div class="body">
						<strong>{item.label}</strong>
						{#if item.detail}
							<span class="detail">{item.detail}</span>
						{/if}
					</div>
					{#if item.date}
						<time datetime={item.date}>{item.date}</time>
					{/if}
				</li>
			{/each}
		</ul>
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
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.65rem;
	}
	li {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.65rem;
		align-items: start;
		padding-bottom: 0.65rem;
		border-bottom: 1px solid var(--line);
	}
	li:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}
	.kind {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--accent);
		border: 1px solid var(--line);
		border-radius: 0.35rem;
		padding: 0.2rem 0.4rem;
		background: var(--paper);
		white-space: nowrap;
	}
	.body {
		display: grid;
		gap: 0.15rem;
		min-width: 0;
	}
	.body strong {
		font-size: 0.95rem;
	}
	.detail {
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	time {
		color: var(--ink-muted);
		font-size: 0.8rem;
		white-space: nowrap;
	}
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
</style>
