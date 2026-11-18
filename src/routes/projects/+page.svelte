<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import NewRouteBadge from '#lib/components/NewRouteBadge.svelte';
	import ProjectReadiness from '#lib/components/ProjectReadiness.svelte';
	import ProjectSelection from '#lib/components/ProjectSelection.svelte';
	import ProjectRouteBeta from '#lib/components/ProjectRouteBeta.svelte';
	import ProjectRouteBadge from '#lib/components/ProjectRouteBadge.svelte';
	import RichText from '#lib/components/RichText.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	type ProjectCard = (typeof data.workingOn)[number];

	function sessionsLabel(n: number) {
		return i18n.t('pages.projects.sessionCount', { count: n });
	}

	function triesLabel(n: number) {
		return i18n.t('pages.projects.tryCount', { count: n });
	}

	function starTitle(stars: number | null | undefined) {
		if (stars == null || stars <= 0) return i18n.t('pages.projects.titleUnrated');
		return i18n.t('pages.projects.titleStars', { count: stars });
	}
</script>

{#snippet projectCard(p: ProjectCard)}
	<article class={['card', { sent: p.status === 'sent' }]}>
		<div class="card-top">
			<span
				class={['star', { filled: (p.stars ?? 0) > 0 }]}
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
				{#if p.isProject}
					<ProjectRouteBadge />
				{:else if p.ungraded}
					<NewRouteBadge />
				{/if}
				<span class={['badge', { open: p.status === 'open', muted: p.status === 'sent' }]}>
					{p.status === 'sent'
						? i18n.t('pages.projects.labelSent')
						: i18n.t('pages.projects.labelOpen')}
				</span>
			</div>
		</div>

		<div class="title-row">
			<a class="name" href={`/projects/${p.routeId}`}>
				{p.routeName}{#if p.gradeLabel}<span class="grade"> · {p.gradeLabel}</span>{/if}
			</a>
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

		{#if p.publicBeta}
			<ProjectRouteBeta beta={p.publicBeta} />
		{/if}

		<p class="footer">{sessionsLabel(p.sessionCount)} · {triesLabel(p.tryCount)}</p>
		<ProjectReadiness pct={p.progress.pct} horizon={p.progress.horizon} />
		<a class="doc-link" href={`/logbook?route=${p.routeId}`}>
			{i18n.t('pages.projects.linkAllLoggedClimbs')}
		</a>
		{#if p.selection === 'include'}<p class="selection-label">
				{i18n.t('pages.projects.labelSelectedByYou')}
			</p>{/if}
		{#if data.canManageProjects}
			<ProjectSelection
				provider={p.routeProvider}
				route={p.routeExternalId}
				name={p.routeName}
				decision={p.selection}
			/>
		{/if}
	</article>
{/snippet}

<section class="head">
	<p class="eyebrow">{i18n.t('pages.projects.eyebrowOutdoorRoutes')}</p>
	<h1>{i18n.t('pages.projects.titleProjects')}</h1>
	<p class="blurb">
		{i18n.t('pages.projects.lead')}
		<a class="doc-link" href="/docs/projects">
			{i18n.t('pages.projects.linkGuidebookTextPrivacy')}
		</a>
		{#if data.canManageProjects}
			<RichText
				message={i18n.t('pages.projects.leadIncludeDismiss')}
				tokens={{
					logbook: {
						kind: 'link',
						text: i18n.t('pages.projects.linkLogbook'),
						href: '/logbook'
					}
				}}
			/>{/if}
	</p>
</section>

{#if form?.message}<p role="alert">{form.message}</p>{/if}

<section class="block">
	<div class="section-head">
		<h2>{i18n.t('pages.projects.titleWorkingOn')}</h2>
		<span class="count">
			{i18n.t('pages.projects.countRoutes', { count: data.workingOn.length })}
		</span>
	</div>
	{#if data.workingOn.length === 0}
		<p class="empty">{i18n.t('pages.projects.emptyNoOpenProjects')}</p>
	{:else}
		<div class="cards">
			{#each data.workingOn as p (p.id)}
				{@render projectCard(p)}
			{/each}
		</div>
	{/if}
</section>

{#if data.earlierSelected.length}
	<section class="block">
		<div class="section-head"><h2>{i18n.t('pages.projects.titleEarlierSelectedSends')}</h2></div>
		<p class="empty">{i18n.t('pages.projects.emptyRoutesYouSelectedWhoseSend')}</p>
		<div class="cards">
			{#each data.earlierSelected as p (p.id)}{@render projectCard(p)}{/each}
		</div>
	</section>
{/if}

<section class="block">
	<div class="section-head">
		<h2>{i18n.t('pages.projects.titleRecentlySent')}</h2>
		<span class="count muted">
			{i18n.t('pages.projects.countRoutes', { count: data.recentlySent.length })}
		</span>
	</div>
	{#if data.recentlySent.length === 0}
		<p class="empty">{i18n.t('pages.projects.emptyNoFoughtThenSentProjects')}</p>
	{:else}
		<div class="cards">
			{#each data.recentlySent as p (p.id)}
				{@render projectCard(p)}
			{/each}
		</div>
	{/if}
</section>

<style>
	.selection-label {
		margin: 0;
		font-size: 0.75rem;
		color: var(--ink-muted);
	}
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
	.doc-link {
		display: inline-block;
		margin-top: 0.35rem;
		color: var(--accent);
		font-weight: 600;
		font-size: 0.9rem;
		text-decoration: none;
	}
	.doc-link:hover {
		text-decoration: underline;
		text-underline-offset: 0.12em;
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
		color: var(--gold);
		background: color-mix(in srgb, var(--gold-soft) 55%, var(--paper));
		border-color: color-mix(in srgb, var(--gold) 35%, var(--line));
	}
	.star.filled svg {
		fill: currentColor;
		stroke: color-mix(in srgb, var(--gold) 70%, var(--ink));
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
		color: var(--ink);
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
