<script lang="ts">
	type GoalCard = {
		id: number;
		title: string;
		progressPct: number;
		progressLabel: string;
		targetLabel: string;
		kindLabel: string;
		completed: boolean;
	};

	type Props = { goals: GoalCard[]; canEdit?: boolean };
	let { goals, canEdit = false }: Props = $props();
</script>

<article class="panel">
	<header>
		<h2>Active goals</h2>
		<a href="/goals">All goals</a>
	</header>

	{#if goals.length === 0}
		<p class="empty">
			{#if canEdit}
				No active goals — <a href="/goals">set one</a>. Grade bars show readiness from nearby sends;
				height and days stay linear.
			{:else}
				No active goals right now.
			{/if}
		</p>
	{:else}
		<ul>
			{#each goals as g (g.id)}
				<li>
					<div class="row">
						<strong>{g.title}</strong>
						<span class="pct">{g.progressPct}%</span>
					</div>
					<p class="meta">{g.kindLabel} · {g.targetLabel}</p>
					<div
						class="bar"
						role="progressbar"
						aria-valuenow={g.progressPct}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-label="{g.title} {g.progressPct} percent"
					>
						<span style:width="{g.progressPct}%"></span>
					</div>
					<p class="progress">{g.progressLabel}</p>
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
	header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	header a {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--accent);
		text-decoration: none;
	}
	header a:hover {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.85rem;
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		align-items: baseline;
	}
	.pct {
		font-weight: 700;
		font-size: 0.9rem;
	}
	.meta,
	.progress,
	.empty {
		margin: 0.2rem 0 0;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
	.bar {
		margin-top: 0.4rem;
		height: 0.5rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
		border-radius: inherit;
	}
	.empty a {
		color: var(--accent);
		font-weight: 600;
	}
</style>
