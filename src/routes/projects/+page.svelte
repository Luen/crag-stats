<script lang="ts">
	import GradeChip from '#lib/components/GradeChip.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<section class="panel head">
	<h1>Projects</h1>
	<p>Auto-detected from attempts and unfinished routes (RoxClimbs-inspired).</p>
</section>

<section class="grid">
	<article class="panel">
		<h2>Open ({data.open.length})</h2>
		{#if data.open.length === 0}
			<p class="empty">No open projects yet.</p>
		{:else}
			<ul>
				{#each data.open as p (p.id)}
					<li>
						<div>
							<strong>{p.routeName}</strong>
							<div class="sub">
								{p.cragName} · {p.attemptCount} attempts · last {(p.lastAttemptAt || '').slice(
									0,
									10
								)}
							</div>
						</div>
						<GradeChip grade={p.gradeRaw} band={p.gradeBand} />
					</li>
				{/each}
			</ul>
		{/if}
	</article>
	<article class="panel">
		<h2>Sent ({data.sent.length})</h2>
		{#if data.sent.length === 0}
			<p class="empty">No sent projects yet.</p>
		{:else}
			<ul>
				{#each data.sent as p (p.id)}
					<li>
						<div>
							<strong>{p.routeName}</strong>
							<div class="sub">
								{p.cragName} · sent {(p.sentAt || '').slice(0, 10)} · {p.attemptCount} attempts
							</div>
						</div>
						<GradeChip grade={p.gradeRaw} band={p.gradeBand} />
					</li>
				{/each}
			</ul>
		{/if}
	</article>
</section>

<style>
	.head,
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.head {
		margin-bottom: 0.9rem;
	}
	h1,
	h2 {
		margin: 0;
	}
	.head p {
		margin: 0.35rem 0 0;
		color: var(--ink-muted);
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
	}
	ul {
		list-style: none;
		margin: 0.85rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}
	li {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: center;
	}
	.sub,
	.empty {
		color: var(--ink-muted);
		font-size: 0.88rem;
	}
	@media (max-width: 800px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
