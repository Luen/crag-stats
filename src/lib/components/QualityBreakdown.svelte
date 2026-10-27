<script lang="ts">
	type Rating = { quality: string; count: number };

	type Props = { ratings: Rating[] };
	let { ratings }: Props = $props();

	const max = $derived(Math.max(1, ...ratings.map((r) => r.count)));
</script>

<article class="panel">
	<h2>Quality ratings</h2>

	{#if ratings.length === 0}
		<p class="empty">No quality ratings yet.</p>
	{:else}
		<ul class="bars">
			{#each ratings as r (r.quality)}
				<li>
					<div class="row">
						<span class="label">{r.quality}</span>
						<span class="value">{r.count}</span>
					</div>
					<div class="track">
						<div class="fill" style:width="{(r.count / max) * 100}%"></div>
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
	.empty {
		color: var(--ink-muted);
		margin: 0;
	}
</style>
