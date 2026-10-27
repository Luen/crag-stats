<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import '../app.css';
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import NavIcon, { type NavIconName } from '#lib/components/NavIcon.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	type NavLink = { href: string; label: string; icon: NavIconName; count?: number };

	/** Dreeve-style groups, separated by dividers in the sidebar. */
	const groups = $derived(
		[
			[{ href: '/', label: 'Dashboard', icon: 'dashboard' }],
			[
				{ href: '/logbook', label: 'Logbook', icon: 'logbook', count: data.navCounts?.ascents },
				{ href: '/projects', label: 'Projects', icon: 'projects', count: data.navCounts?.projects },
				{ href: '/sectors', label: 'Sectors', icon: 'sectors' }
			],
			[
				{ href: '/goals', label: 'Goals', icon: 'goals' },
				{ href: '/rewind', label: 'Rewind', icon: 'rewind' }
			],
			data.showSettings ? [{ href: '/settings', label: 'Settings', icon: 'settings' }] : []
		].filter((g) => g.length > 0) as NavLink[][]
	);

	const current = $derived(
		groups.flat().find((l) => l.href === page.url.pathname) ??
			(page.url.pathname === '/login' ? { label: 'Sign in' } : null)
	);

	// Sidebar: "mini" (icon rail) on desktop, off-canvas drawer on mobile.
	// Initial state comes from html[data-sidebar], set pre-paint in app.html.
	let mini = $state(false);
	let drawerOpen = $state(false);
	let dark = $state(false);

	onMount(() => {
		const root = document.documentElement;
		mini = root.dataset.sidebar === 'mini';
		dark =
			root.dataset.theme === 'dark' ||
			(!root.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
	});

	afterNavigate(() => {
		drawerOpen = false;
	});

	function save(key: string, value: string | null) {
		try {
			if (value == null) localStorage.removeItem(key);
			else localStorage.setItem(key, value);
		} catch {
			// Storage blocked (private mode) — state still applies for this page view.
		}
	}

	function toggleSidebar() {
		if (matchMedia('(max-width: 860px)').matches) {
			drawerOpen = !drawerOpen;
			return;
		}
		mini = !mini;
		if (mini) document.documentElement.dataset.sidebar = 'mini';
		else delete document.documentElement.dataset.sidebar;
		save('cs_sidebar', mini ? 'mini' : null);
	}

	function toggleTheme() {
		dark = !dark;
		const theme = dark ? 'dark' : 'light';
		document.documentElement.dataset.theme = theme;
		save('cs_theme', theme);
	}

	const fmt = (n: number) => n.toLocaleString();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{current && current.label !== 'Dashboard' ? `${current.label} · Crag Stats` : 'Crag Stats'}</title>
</svelte:head>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (drawerOpen = false)} />

<div class="app" class:drawer-open={drawerOpen}>
	<header class="topbar">
		<button
			type="button"
			class="icon-btn"
			onclick={toggleSidebar}
			aria-label={drawerOpen ? 'Close menu' : mini ? 'Expand sidebar' : 'Collapse sidebar'}
			aria-expanded={drawerOpen || !mini}
			aria-controls="side-nav"
			title={mini ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			<NavIcon name="sidebar" />
		</button>
		<a class="brand" href="/" aria-label="Crag Stats home">
			<img class="brand-mark" src={favicon} alt="" width="34" height="34" />
			<span class="wordmark">Crag<span>Stats</span></span>
		</a>
		<div class="top-actions">
			<a
				class="icon-btn"
				href={data.githubUrl}
				target="_blank"
				rel="noreferrer"
				title="GitHub repository"
				aria-label="GitHub repository"
			>
				<NavIcon name="github" />
			</a>
			<button
				type="button"
				class="icon-btn"
				onclick={toggleTheme}
				title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
				aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
			>
				<NavIcon name={dark ? 'sun' : 'moon'} />
			</button>
			{#if data.showSettings}
				<a
					class="icon-btn"
					href="/settings"
					title="Settings & sync"
					aria-label="Settings & sync"
				>
					<NavIcon name="settings" />
				</a>
			{/if}
		</div>
	</header>

	<aside class="side" id="side-nav" aria-label="Primary">
		<nav>
			{#each groups as group, gi (gi)}
				{#if gi > 0}<hr />{/if}
				{#each group as link (link.href)}
					<a
						href={link.href}
						class={{ active: page.url.pathname === link.href }}
						aria-current={page.url.pathname === link.href ? 'page' : undefined}
						aria-label={link.label}
					>
						<span class="ico"><NavIcon name={link.icon} /></span>
						<span class="label">{link.label}</span>
						{#if link.count}
							<span class="count">{fmt(link.count)}</span>
						{/if}
						<span class="tip" aria-hidden="true">{link.label}</span>
					</a>
				{/each}
			{/each}
		</nav>
		<div class="side-foot">
			<a
				class="ver"
				href="{data.githubUrl}/releases"
				target="_blank"
				rel="noreferrer"
				title="Installed app version">{data.appVersion}</a
			>
		</div>
	</aside>
	<button
		type="button"
		class="backdrop"
		tabindex="-1"
		aria-label="Close menu"
		onclick={() => (drawerOpen = false)}
	></button>

	<div class="content">
		{#if current}
			<div class="crumb">
				<NavIcon name="home" size={15} />
				<span>{current.label}</span>
			</div>
		{/if}
		<main>
			{@render children()}
		</main>
		<footer>
			<p>
				Self-hosted climbing analytics · MIT · Data from
				<a href="https://www.thecrag.com/" target="_blank" rel="noreferrer">theCrag</a>
				·
				<a href={data.githubUrl} target="_blank" rel="noreferrer">{data.appVersion}</a>
			</p>
		</footer>
	</div>
</div>

<style>
	.app {
		--side: var(--side-w);
		min-height: 100vh;
	}
	:global(html[data-sidebar='mini']) .app {
		--side: var(--side-mini-w);
	}

	/* ---------- Top bar ---------- */
	.topbar {
		position: fixed;
		inset: 0 0 auto 0;
		height: var(--header-h);
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0 1rem 0 0.9rem;
		background: var(--paper);
		border-bottom: 1px solid var(--line);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		color: var(--ink);
		min-width: 0;
	}
	.brand-mark {
		flex-shrink: 0;
		display: block;
	}
	.wordmark {
		font-size: 1.2rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		white-space: nowrap;
	}
	.wordmark span {
		color: var(--accent);
		margin-left: 0.2em;
	}
	.top-actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.15rem;
	}
	.icon-btn {
		display: inline-grid;
		place-items: center;
		width: 2.4rem;
		height: 2.4rem;
		border-radius: 0.6rem;
		border: 0;
		background: transparent;
		color: var(--ink-muted);
		cursor: pointer;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.icon-btn:hover {
		background: var(--surface-3);
		color: var(--ink);
	}

	/* ---------- Sidebar ---------- */
	.side {
		position: fixed;
		top: var(--header-h);
		bottom: 0;
		left: 0;
		width: var(--side);
		z-index: 30;
		display: flex;
		flex-direction: column;
		background: var(--paper);
		border-right: 1px solid var(--line);
		padding: 0.9rem 0.7rem;
		overflow-y: auto;
		overflow-x: hidden;
		transition: width 0.2s ease;
	}
	.side nav {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex: 1;
	}
	.side hr {
		border: 0;
		border-top: 1px solid var(--line);
		margin: 0.55rem 0.35rem;
	}
	.side nav a {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		height: 2.6rem;
		padding: 0 0.7rem;
		border-radius: 0.6rem;
		color: var(--ink);
		font-weight: 600;
		font-size: 0.92rem;
		white-space: nowrap;
		transition:
			background 0.15s,
			color 0.15s;
	}
	.ico {
		display: inline-grid;
		place-items: center;
		flex-shrink: 0;
		color: var(--ink-muted);
	}
	.side nav a:hover {
		background: var(--surface-2);
	}
	.side nav a.active {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.side nav a.active .ico {
		color: var(--accent);
	}
	.label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.count {
		font-size: 0.75rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, var(--paper));
		border-radius: 999px;
		padding: 0.1rem 0.55rem;
	}
	.tip {
		display: none;
	}
	.side-foot {
		display: flex;
		justify-content: center;
		padding-top: 0.75rem;
		border-top: 1px solid var(--line);
	}
	.ver {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--ink-muted);
		background: var(--surface-3);
		border-radius: 0.4rem;
		padding: 0.15rem 0.55rem;
		font-variant-numeric: tabular-nums;
	}
	.ver:hover {
		color: var(--ink);
	}

	/* Mini (icon rail) — desktop only */
	@media (min-width: 861px) {
		:global(html[data-sidebar='mini']) .side {
			padding-inline: 0.75rem;
			overflow: visible;
		}
		:global(html[data-sidebar='mini']) .side nav a {
			justify-content: center;
			padding: 0;
		}
		:global(html[data-sidebar='mini']) .label,
		:global(html[data-sidebar='mini']) .count {
			display: none;
		}
		:global(html[data-sidebar='mini']) .ver {
			font-size: 0.65rem;
			padding: 0.1rem 0.35rem;
		}
		:global(html[data-sidebar='mini']) .side nav a:hover .tip,
		:global(html[data-sidebar='mini']) .side nav a:focus-visible .tip {
			display: block;
			position: absolute;
			left: calc(100% + 0.65rem);
			top: 50%;
			transform: translateY(-50%);
			background: var(--ink);
			color: var(--paper);
			font-size: 0.8rem;
			font-weight: 600;
			padding: 0.3rem 0.6rem;
			border-radius: 0.4rem;
			pointer-events: none;
			box-shadow: var(--shadow);
			z-index: 50;
		}
	}

	.backdrop {
		display: none;
	}

	/* ---------- Content ---------- */
	.content {
		margin-left: var(--side);
		padding: calc(var(--header-h) + 1.1rem) 1.5rem 2.5rem;
		min-width: 0;
		transition: margin-left 0.2s ease;
	}
	.content main {
		min-width: 0;
		max-width: 100%;
		overflow-x: clip;
	}
	.crumb {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--ink);
		margin-bottom: 0.9rem;
	}
	.crumb :global(svg) {
		color: var(--ink-muted);
	}
	footer {
		margin-top: 2.5rem;
		color: var(--ink-muted);
		font-size: 0.85rem;
	}
	footer a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.side,
		.content {
			transition: none;
		}
	}

	/* ---------- Mobile: off-canvas drawer ---------- */
	@media (max-width: 860px) {
		.side {
			width: min(17rem, 82vw);
			transform: translateX(-100%);
			transition: transform 0.22s ease;
			box-shadow: none;
		}
		.drawer-open .side {
			transform: none;
			box-shadow: 0 10px 40px rgba(0, 0, 0, 0.18);
		}
		.backdrop {
			display: block;
			position: fixed;
			inset: var(--header-h) 0 0 0;
			z-index: 25;
			border: 0;
			padding: 0;
			background: rgba(10, 12, 16, 0.35);
			opacity: 0;
			pointer-events: none;
			transition: opacity 0.2s;
		}
		.drawer-open .backdrop {
			opacity: 1;
			pointer-events: auto;
		}
		.content {
			margin-left: 0;
			padding: calc(var(--header-h) + 0.85rem) 0.85rem 2rem;
		}
		.wordmark {
			font-size: 1.1rem;
		}
	}
</style>
