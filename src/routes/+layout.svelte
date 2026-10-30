<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import '../app.css';
	import { onMount, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { formatNumber } from '#lib/dates';
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
				{ href: '/sectors', label: 'Sectors', icon: 'sectors' },
				{ href: '/partners', label: 'Partners', icon: 'partners' }
			],
			[
				{ href: '/goals', label: 'Goals', icon: 'goals' },
				{ href: '/activity', label: 'Activity', icon: 'activity' },
				{ href: '/badges', label: 'Badges', icon: 'badges' },
				{ href: '/eddington', label: 'Eddington', icon: 'eddington' },
				{ href: '/training-load', label: 'Training load', icon: 'training' },
				{ href: '/milestones', label: 'Milestones', icon: 'milestones' },
				{ href: '/rewind', label: 'Rewind', icon: 'rewind' },
				{ href: '/share', label: 'Share', icon: 'share' }
			],
			[
				{ href: '/docs', label: 'Docs', icon: 'docs' },
				...(data.showSettings ? [{ href: '/settings', label: 'Settings', icon: 'settings' }] : [])
			]
		].filter((g) => g.length > 0) as NavLink[][]
	);

	/** Exact match, or a section prefix (e.g. /docs/cpr → Docs). */
	const isActive = (href: string) =>
		page.url.pathname === href || (href !== '/' && page.url.pathname.startsWith(`${href}/`));

	const current = $derived(
		groups.flat().find((l) => isActive(l.href)) ??
			(page.url.pathname === '/login' ? { label: 'Sign in' } : null)
	);

	// Sidebar: "mini" (icon rail) on desktop, off-canvas drawer on mobile.
	// Initial state comes from html[data-sidebar], set pre-paint in app.html.
	let mini = $state(false);
	let drawerOpen = $state(false);
	let isMobile = $state(false);

	// Theme: follow the OS ("system") unless the user picked light/dark (#43).
	type Theme = 'system' | 'light' | 'dark';
	const THEME_ORDER: Theme[] = ['system', 'light', 'dark'];
	const THEME_LABEL: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' };
	const THEME_ICON: Record<Theme, NavIconName> = { system: 'monitor', light: 'sun', dark: 'moon' };
	let theme = $state<Theme>('system');
	const nextTheme = $derived(THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]);

	let toggleBtn: HTMLButtonElement | undefined = $state();
	let sideEl: HTMLElement | undefined = $state();

	onMount(() => {
		const root = document.documentElement;
		mini = root.dataset.sidebar === 'mini';
		const t = root.dataset.theme;
		theme = t === 'light' || t === 'dark' ? t : 'system';

		const mq = matchMedia('(max-width: 860px)');
		isMobile = mq.matches;
		const onChange = (e: MediaQueryListEvent) => {
			isMobile = e.matches;
			if (!e.matches) drawerOpen = false;
		};
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
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

	async function openDrawer() {
		drawerOpen = true;
		await tick();
		sideEl?.querySelector<HTMLElement>('a[href]')?.focus();
	}

	function closeDrawer() {
		if (!drawerOpen) return;
		const hadFocus = sideEl?.contains(document.activeElement) ?? false;
		drawerOpen = false;
		if (hadFocus) toggleBtn?.focus();
	}

	/** Keep Tab inside the open mobile drawer. */
	function trapFocus(e: KeyboardEvent) {
		if (!drawerOpen || e.key !== 'Tab' || !sideEl) return;
		const items = [...sideEl.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')];
		if (items.length === 0) return;
		const first = items[0];
		const last = items[items.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	function toggleSidebar() {
		if (isMobile) {
			if (drawerOpen) closeDrawer();
			else void openDrawer();
			return;
		}
		mini = !mini;
		if (mini) document.documentElement.dataset.sidebar = 'mini';
		else delete document.documentElement.dataset.sidebar;
		save('cs_sidebar', mini ? 'mini' : null);
	}

	function cycleTheme() {
		theme = nextTheme;
		const root = document.documentElement;
		if (theme === 'system') delete root.dataset.theme;
		else root.dataset.theme = theme;
		save('cs_theme', theme === 'system' ? null : theme);
	}

	const fmt = (n: number) => formatNumber(n, data.dateDisplay);

	const pageOg = $derived(page.data.og as { title?: string; description?: string } | undefined);
	const ogTitle = $derived(
		pageOg?.title ?? (current ? `${current.label} · Crag Stats` : 'Crag Stats')
	);
	const ogDescription = $derived(
		pageOg?.description ?? 'Self-hosted climbing analytics for a theCrag logbook.'
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/manifest.webmanifest" />
	{#if data.noindex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<!-- Share previews (#44): only when the site may be indexed, never on login/admin pages. -->
		<meta name="description" content={ogDescription} />
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="Crag Stats" />
		<meta property="og:title" content={ogTitle} />
		<meta property="og:description" content={ogDescription} />
		<meta property="og:url" content={page.url.origin + page.url.pathname} />
		<meta property="og:image" content="{page.url.origin}/og-image.png" />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
	<title
		>{current && current.label !== 'Dashboard'
			? `${current.label} · Crag Stats`
			: 'Crag Stats'}</title
	>
</svelte:head>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') closeDrawer();
		else trapFocus(e);
	}}
/>

<div class="app" class:drawer-open={drawerOpen}>
	<header class="topbar">
		<button
			bind:this={toggleBtn}
			type="button"
			class="icon-btn"
			onclick={toggleSidebar}
			aria-label={drawerOpen ? 'Close menu' : mini ? 'Expand sidebar' : 'Collapse sidebar'}
			aria-expanded={isMobile ? drawerOpen : !mini}
			aria-controls="side-nav"
			title={mini ? 'Expand sidebar' : 'Collapse sidebar'}
		>
			<NavIcon name="sidebar" />
		</button>
		<a class="brand" href="/">
			<img class="brand-mark" src={favicon} alt="" width="34" height="34" />
			<span class="wordmark">Crag <span>Stats</span></span>
		</a>
		<div class="top-actions">
			<a class="icon-btn" href="/share" title="Share & embed" aria-label="Share & embed">
				<NavIcon name="share" />
			</a>
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
				onclick={cycleTheme}
				title="Theme: {THEME_LABEL[theme]} — switch to {THEME_LABEL[nextTheme]}"
				aria-label="Theme: {THEME_LABEL[theme]}. Switch to {THEME_LABEL[nextTheme]}"
			>
				<NavIcon name={THEME_ICON[theme]} />
			</button>
			{#if data.showSettings}
				<a class="icon-btn" href="/settings" title="Settings & sync" aria-label="Settings & sync">
					<NavIcon name="settings" />
				</a>
			{/if}
			{#if data.authEnabled && data.authed}
				<form method="POST" action="/logout" class="logout">
					<button type="submit" class="icon-btn" title="Log out" aria-label="Log out">
						<NavIcon name="logout" />
					</button>
				</form>
			{/if}
		</div>
	</header>

	<!-- Off-screen drawer is inert on mobile so hidden links aren't tabbable. -->
	<aside
		bind:this={sideEl}
		class="side"
		id="side-nav"
		aria-label="Primary"
		inert={isMobile && !drawerOpen}
	>
		<nav>
			{#each groups as group, gi (gi)}
				{#if gi > 0}<hr />{/if}
				{#each group as link (link.href)}
					<a
						href={link.href}
						class={{ active: isActive(link.href) }}
						aria-current={isActive(link.href) ? 'page' : undefined}
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
	<button type="button" class="backdrop" tabindex="-1" aria-label="Close menu" onclick={closeDrawer}
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
		color: var(--brand);
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
	.logout {
		display: contents;
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
		color: var(--ink);
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
		:global(html[data-sidebar='mini']) .label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0 0 0 0);
			white-space: nowrap;
		}
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
			box-shadow: var(--shadow-lg);
		}
		.backdrop {
			display: block;
			position: fixed;
			inset: var(--header-h) 0 0 0;
			z-index: 25;
			border: 0;
			padding: 0;
			background: var(--scrim);
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
