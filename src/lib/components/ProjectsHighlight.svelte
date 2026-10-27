<script lang="ts">
	type ProjectCard = {
		id: number;
		status: string;
		routeName: string;
		gradeRaw: string | null;
		areaLabel: string;
		sessionCount: number;
		tryCount: number;
		href: string | null;
		lastAttemptAt: string | null;
	};

	type Props = { projects: ProjectCard[] };
	let { projects }: Props = $props();

	function sessionsLabel(n: number) {
		return n === 1 ? '1 session' : `${n} sessions`;
	}

	function triesLabel(n: number) {
		return n === 1 ? '1 try' : `${n} tries`;
	}

	function when(iso: string | null) {
		if (!iso) return '';
		const d = iso.slice(0, 10);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
		const dt = new Date(`${d}T12:00:00Z`);
		if (Number.isNaN(dt.getTime())) return d;
		return dt.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'UTC'
		});
	}
</script>

<article class="panel">
	<header>
		<h2>Projects</h2>
		<a href="/projects">All projects</a>
	</header>

	{#if projects.length === 0}
		<p class="empty">
			No open projects — log attempts on a route and it shows up on
			<a href="/projects">Projects</a>.
		</p>
	{:else}
		<ul>
			{#each projects as p (p.id)}
				<li>
					<div class="row">
						{#if p.href}
							<a class="name" href={p.href} target="_blank" rel="noreferrer">
								{p.routeName}{#if p.gradeRaw}<span class="grade"> · {p.gradeRaw}</span>{/if}
							</a>
						{:else}
							<strong class="name">
								{p.routeName}{#if p.gradeRaw}<span class="grade"> · {p.gradeRaw}</span>{/if}
							</strong>
						{/if}
						<span class="badge" class:sent={p.status === 'sent'}>{p.status}</span>
					</div>
					{#if p.areaLabel}
						<p class="meta">{p.areaLabel}</p>
					{/if}
					<p class="meta">
						{sessionsLabel(p.sessionCount)} · {triesLabel(p.tryCount)}{#if when(p.lastAttemptAt)}
							· {when(p.lastAttemptAt)}{/if}
					</p>
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
	.empty a {
		color: var(--accent);
		font-weight: 600;
	}
</style>
