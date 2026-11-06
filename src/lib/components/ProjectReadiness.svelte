<script lang="ts">
	let { pct, horizon }: { pct: number | null; horizon: string } = $props();
</script>

<div class="readiness">
	<div class="label">
		<span>{pct === 100 ? 'Sent' : 'Approximate readiness'}</span>
		<strong>{pct == null ? 'Not enough grade data' : `${pct}%`}</strong>
	</div>
	{#if pct != null}
		<progress max="100" value={pct} aria-label="Approximate project readiness">{pct}%</progress>
	{/if}
	{#if pct !== 100}<span class="horizon">{horizon} · an estimate, not a send probability</span>{/if}
</div>

<style>
	.readiness {
		margin-top: 0.65rem;
	}
	.label {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 0.4rem;
		font-size: 0.8rem;
		color: var(--ink);
	}
	progress {
		display: block;
		width: 100%;
		height: 0.5rem;
		margin: 0.4rem 0;
		appearance: none;
		border: 0;
		border-radius: 999px;
		overflow: hidden;
		background: var(--surface-3);
	}
	progress::-webkit-progress-bar {
		background: var(--surface-3);
	}
	progress::-webkit-progress-value {
		background: var(--accent);
		border-radius: 999px;
	}
	progress::-moz-progress-bar {
		background: var(--accent);
		border-radius: 999px;
	}
	.horizon {
		font-size: 0.75rem;
		color: var(--ink-muted);
	}
</style>
