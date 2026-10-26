<script lang="ts">
	type Share = { style: string; count: number; pct: number; color: string };
	type Props = { shares: Share[]; climberType: string };
	let { shares, climberType }: Props = $props();
</script>

<article class="panel">
	<header>
		<h2>Climber type</h2>
		<strong class="type">{climberType}</strong>
	</header>
	<p class="hint">≥40% in one discipline → that climber type; otherwise “Rock climber”.</p>
	{#if shares.length}
		<div class="bar" role="img" aria-label="Climbing style distribution">
			{#each shares as s (s.style)}
				{#if s.pct >= 2}
					<span class="seg" style:flex={s.pct} style:background={s.color} title="{s.style}: {s.pct}%"
						>{#if s.pct >= 8}{s.style.toUpperCase()} {Math.round(s.pct)}%{/if}</span
					>
				{/if}
			{/each}
		</div>
		<ul class="legend">
			{#each shares as s (s.style)}
				<li><i style:background={s.color}></i>{s.style} · {s.pct}% ({s.count})</li>
			{/each}
		</ul>
	{/if}
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: baseline;
	}
	h2 {
		margin: 0;
		font-size: 1.2rem;
	}
	.type {
		font-family: Fraunces, Georgia, serif;
		font-size: 1.25rem;
		color: var(--accent);
	}
	.hint {
		margin: 0.35rem 0 0.85rem;
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.bar {
		display: flex;
		height: 2.1rem;
		border-radius: 0.35rem;
		overflow: hidden;
		background: rgba(28, 36, 24, 0.08);
	}
	.seg {
		display: grid;
		place-items: center;
		color: white;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.02em;
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
		min-width: 0;
	}
	.legend {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem 1rem;
		font-size: 0.85rem;
		color: var(--ink-muted);
	}
	.legend i {
		display: inline-block;
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 2px;
		margin-right: 0.3rem;
	}
</style>
