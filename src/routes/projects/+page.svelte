<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type ProjectCard = (typeof data.workingOn)[number];

	function sessionsLabel(n: number) {
		return n === 1 ? '1 session' : `${n} sessions`;
	}

	function triesLabel(n: number) {
		return n === 1 ? '1 try logged' : `${n} tries logged`;
	}

	function starTitle(stars: number | null | undefined) {
		if (stars == null || stars <= 0) return 'Unrated';
		return `${stars} star${stars === 1 ? '' : 's'}`;
	}
</script>

{#snippet projectCard(p: ProjectCard)}
	<article class="card" class:sent={p.status === 'sent'}>
		<div class="card-top">
			<span
				class="star"
				class:filled={(p.stars ?? 0) > 0}
				title={starTitle(p.stars)}
				aria-hidden="true"
			>
				<svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
					<path
						d="M12 3.6l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 16.9l-4.8 2.52.92-5.34-3.88-3.78 5.36-.78L12 3.6z"
					/>
				</svg>
			</span>
			<div class="badges">
				<span class="badge" class:open={p.status === 'open'} class:muted={p.status === 'sent'}>
					{p.status === 'sent' ? 'sent' : 'open'}
				</span>
			</div>
		</div>

		<div class="title-row">
			{#if p.href}
				<a class="name" href={p.href} target="_blank" rel="noreferrer">
					{p.routeName}{#if p.gradeRaw}<span class="grade"> · {p.gradeRaw}</span>{/if}
				</a>
			{:else}
				<span class="name">
					{p.routeName}{#if p.gradeRaw}<span class="grade"> · {p.gradeRaw}</span>{/if}
				</span>
			{/if}
		</div>

		{#if p.areaLabel}
			<p class="area">
				{#if p.cragUrl}
					<a href={p.cragUrl} target="_blank" rel="noreferrer">{p.areaLabel}</a>
				{:else}
					{p.areaLabel}
				{/if}
			</p>
		{/if}

		<p class="footer">{sessionsLabel(p.sessionCount)} · {triesLabel(p.tryCount)}</p>
	</article>
{/snippet}

<section class="head">
	<p class="eyebrow">Outdoor routes</p>
	<h1>Auto-detected projects</h1>
	<p class="blurb">
		Auto-detected from theCrag: open routes with unsent attempts in the last year, plus sends that
		had a fight before the send (shown ~31 days). Routes untouched for a year drop off. First-try
		sends are not projects.
	</p>
</section>

<section class="block">
	<div class="section-head">
		<h2>Working on</h2>
		<span class="count">{data.workingOn.length} route{data.workingOn.length === 1 ? '' : 's'}</span>
	</div>
	{#if data.workingOn.length === 0}
		<p class="empty">No open projects yet. Log an attempt on theCrag and it will show up here.</p>
	{:else}
		<div class="cards">
			{#each data.workingOn as p (p.id)}
				{@render projectCard(p)}
			{/each}
		</div>
	{/if}
</section>

<section class="block">
	<div class="section-head">
		<h2>Recently sent</h2>
		<span class="count muted"
			>{data.recentlySent.length} route{data.recentlySent.length === 1 ? '' : 's'}</span
		>
	</div>
	{#if data.recentlySent.length === 0}
		<p class="empty">No fought-then-sent projects in the last month.</p>
	{:else}
		<div class="cards">
			{#each data.recentlySent as p (p.id)}
				{@render projectCard(p)}
			{/each}
		</div>
	{/if}
</section>

<style>
	.head {
		margin-bottom: 1.35rem;
	}
	.eyebrow {
		margin: 0 0 0.35rem;
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	h1,
	h2 {
		margin: 0;
	}
	h1 {
		font-size: clamp(1.65rem, 2.4vw, 2.1rem);
	}
	.blurb {
		margin: 0.45rem 0 0;
		max-width: 46rem;
		color: var(--ink-muted);
		line-height: 1.45;
	}
	.block {
		margin-bottom: 1.6rem;
	}
	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-bottom: 0.85rem;
	}
	.count {
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--accent-2) 35%, var(--line));
		background: color-mix(in srgb, var(--band-intermediate) 28%, var(--paper));
		color: color-mix(in srgb, var(--accent-2) 80%, var(--ink));
		font-size: 0.82rem;
		font-weight: 600;
		white-space: nowrap;
	}
	.count.muted {
		background: color-mix(in srgb, var(--bg-deep) 70%, var(--paper));
		border-color: var(--line);
		color: var(--ink-muted);
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 0.9rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1rem 1.05rem 0.9rem;
		border-radius: 1rem;
		background: var(--paper);
		border: 1px solid var(--line);
		box-shadow:
			0 1px 0 color-mix(in srgb, var(--ink) 4%, transparent),
			0 8px 20px color-mix(in srgb, var(--ink) 4%, transparent);
		min-height: 8.5rem;
	}
	.card.sent {
		opacity: 0.92;
	}
	.card-top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.star {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--bg) 55%, var(--paper));
		color: var(--ink-muted);
		flex-shrink: 0;
	}
	.star svg {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.4;
		stroke-linejoin: round;
	}
	.star.filled {
		color: #c9a227;
		background: color-mix(in srgb, #f5e6a8 55%, var(--paper));
		border-color: color-mix(in srgb, #c9a227 35%, var(--line));
	}
	.star.filled svg {
		fill: currentColor;
		stroke: color-mix(in srgb, #8a6d12 70%, currentColor);
	}
	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		justify-content: flex-end;
	}
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.12rem 0.55rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 650;
		text-transform: lowercase;
		border: 1px solid color-mix(in srgb, var(--accent-2) 40%, var(--line));
		background: color-mix(in srgb, var(--band-intermediate) 32%, var(--paper));
		color: color-mix(in srgb, var(--accent-2) 85%, var(--ink));
	}
	.badge.muted {
		background: color-mix(in srgb, var(--bg-deep) 65%, var(--paper));
		border-color: var(--line);
		color: var(--ink-muted);
	}
	.title-row {
		margin-top: 0.15rem;
	}
	.name {
		color: var(--ink);
		font-weight: 700;
		font-size: 1.02rem;
		line-height: 1.3;
		text-decoration: none;
	}
	a.name:hover {
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
	.grade {
		font-weight: 650;
	}
	.area {
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.9rem;
		line-height: 1.35;
	}
	.area a {
		color: inherit;
		text-decoration: none;
	}
	.area a:hover {
		text-decoration: underline;
		text-underline-offset: 0.12em;
	}
	.footer {
		margin: auto 0 0;
		padding-top: 0.55rem;
		color: var(--ink-muted);
		font-size: 0.84rem;
	}
	.empty {
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.95rem;
	}

	@media (max-width: 640px) {
		.cards {
			grid-template-columns: 1fr;
		}
		.section-head {
			align-items: flex-start;
		}
	}
</style>
