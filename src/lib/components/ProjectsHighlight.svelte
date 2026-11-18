<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import NewRouteBadge from '#lib/components/NewRouteBadge.svelte';
	import ProjectReadiness from '#lib/components/ProjectReadiness.svelte';
	import ProjectRouteBadge from '#lib/components/ProjectRouteBadge.svelte';
	import RichText from '#lib/components/RichText.svelte';
	import { DEFAULT_DATE_DISPLAY, formatCalendarDate, type DateDisplay } from '#lib/dates';

	type ProjectCard = {
		id: number;
		routeId: number;
		status: string;
		routeName: string;
		gradeRaw: string | null;
		gradeLabel: string | null;
		ungraded: boolean;
		isProject: boolean;
		areaLabel: string;
		sessionCount: number;
		tryCount: number;
		href: string | null;
		lastAttemptAt: string | null;
		progress: { pct: number | null; horizon: string };
	};

	type Props = { projects: ProjectCard[]; dateDisplay?: DateDisplay };
	let { projects, dateDisplay = DEFAULT_DATE_DISPLAY }: Props = $props();
	const i18n = useI18n();

	function sessionsLabel(n: number) {
		return i18n.t('cards.projectsHighlight.sessionsCount', { count: n });
	}

	function triesLabel(n: number) {
		return i18n.t('cards.projectsHighlight.triesCount', { count: n });
	}

	function when(iso: string | null) {
		if (!iso) return '';
		return formatCalendarDate(iso, dateDisplay);
	}
</script>

<article class="panel">
	<header>
		<h2>{i18n.t('cards.projectsHighlight.titleProjects')}</h2>
		<a href="/projects">{i18n.t('cards.projectsHighlight.linkAllProjects')}</a>
	</header>

	{#if projects.length === 0}
		<p class="empty">
			<RichText
				message={i18n.t('cards.projectsHighlight.emptyNoOpenProjects')}
				tokens={{
					projects: {
						kind: 'link',
						text: i18n.t('cards.projectsHighlight.titleProjects'),
						href: '/projects'
					}
				}}
			/>
		</p>
	{:else}
		<ul>
			{#each projects as p (p.id)}
				<li>
					<div class="row">
						<a class="name" href={`/projects/${p.routeId}`}>
							{p.routeName}{#if p.gradeLabel}<span class="grade"> · {p.gradeLabel}</span>{/if}
						</a>
						{#if p.isProject}
							<ProjectRouteBadge />
						{:else if p.ungraded}
							<NewRouteBadge />
						{/if}
						<span class={['badge', { sent: p.status === 'sent' }]}>
							{p.status === 'sent'
								? i18n.t('pages.projects.labelSent')
								: i18n.t('pages.projects.labelOpen')}
						</span>
					</div>
					{#if p.areaLabel}
						<p class="meta">{p.areaLabel}</p>
					{/if}
					<p class="meta">
						{sessionsLabel(p.sessionCount)} · {triesLabel(p.tryCount)}{#if when(p.lastAttemptAt)}
							· {when(p.lastAttemptAt)}{/if}
					</p>
					<ProjectReadiness pct={p.progress.pct} horizon={p.progress.horizon} />
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
		gap: 0.75rem;
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		align-items: baseline;
	}
	.name {
		font-weight: 700;
		font-size: 0.95rem;
		color: var(--ink);
		text-decoration: none;
		min-width: 0;
	}
	a.name:hover {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.grade {
		font-weight: 600;
		color: var(--ink-muted);
	}
	.badge {
		flex-shrink: 0;
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 0.12rem 0.4rem;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--accent-2) 40%, var(--line));
		color: color-mix(in srgb, var(--accent-2) 85%, var(--ink));
	}
	.badge.sent {
		border-color: color-mix(in srgb, var(--accent) 35%, var(--line));
		color: color-mix(in srgb, var(--accent) 80%, var(--ink));
	}
	.meta,
	.empty {
		margin: 0.2rem 0 0;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
	.empty :global(a) {
		color: var(--accent);
		font-weight: 600;
	}
</style>
