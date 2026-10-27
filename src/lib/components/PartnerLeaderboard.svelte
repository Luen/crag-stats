<script lang="ts">
	type Partner = { name: string; count: number };

	type Props = { partners: Partner[] };
	let { partners }: Props = $props();

	const max = $derived(Math.max(1, ...partners.map((p) => p.count)));
</script>

<article class="panel">
	<h2>Partners</h2>

	{#if partners.length === 0}
		<p class="empty">No partners recorded yet.</p>
	{:else}
		<ul class="bars">
			{#each partners as p (p.name)}
				<li>
					<div class="row">
						<a class="label" href={`/logbook?q=${encodeURIComponent(p.name)}`}>{p.name}</a>
						<span class="value">{p.count}</span>
					</div>
					<div class="track">
						<div class="fill" style:width="{(p.count / max) * 100}%"></div>
					</div>
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
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.value {
		color: var(--ink-muted);
	}
	.track {
		height: 0.45rem;
		border-radius: 999px;
		background: rgba(28, 36, 24, 0.08);
		overflow: hidden;
		margin-top: 0.25rem;
	}
	.fill {
		height: 100%;
		border-radius: inherit;
		background: var(--accent);
		transition: width 400ms ease;
	}
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
</style>
