<script lang="ts">
	type Item = {
		id: string;
		kind: string;
		label: string;
		date: string | null;
		detail: string;
	};

	type Props = {
		items: Item[];
		/** Cap list length on the dashboard; omit on the full page. */
		limit?: number;
		/** Dashboard links to `/milestones`; pass `null` on the full page to skip the title link. */
		titleHref?: string | null;
	};
	let { items, limit, titleHref = '/milestones' }: Props = $props();

	const sorted = $derived(
		[...items].sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
	);
	const shown = $derived(limit != null ? sorted.slice(0, limit) : sorted);
	const remaining = $derived(limit != null ? Math.max(0, sorted.length - shown.length) : 0);
</script>

<article class="panel">
	<header>
		<h2>
			{#if titleHref}
				<a href={titleHref}>Milestones</a>
			{:else}
				Milestones
			{/if}
		</h2>
	</header>

	{#if sorted.length === 0}
		<p class="empty">No milestones yet — keep ticking.</p>
	{:else}
		<ul>
			{#each shown as item (item.id)}
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
		{#if remaining > 0}
			<a class="more" href={titleHref || '/milestones'}>Show more ({remaining} more)</a>
		{/if}
	{/if}
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	header {
		margin-bottom: 0.75rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	h2 a {
		color: inherit;
		text-decoration: none;
	}
	h2 a:hover {
		color: var(--accent);
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
	.more {
		display: inline-block;
		margin-top: 0.75rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent);
	}
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
</style>
