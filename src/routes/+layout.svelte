<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import '../app.css';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const links = $derived(
		[
			{ href: '/', label: 'Dashboard' },
			{ href: '/logbook', label: 'Logbook' },
			{ href: '/projects', label: 'Projects' },
			{ href: '/sectors', label: 'Sectors' },
			{ href: '/goals', label: 'Goals' },
			{ href: '/rewind', label: 'Rewind' },
			data.showSettings ? { href: '/settings', label: 'Settings' } : null
		].filter((l): l is { href: string; label: string } => l != null)
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Crag Stats</title>
</svelte:head>

<div class="frame">
	<aside class="side">
		<a class="brand" href="/">
			<img class="brand-mark" src={favicon} alt="" width="28" height="28" />
			<span>Crag Stats</span>
		</a>
		<nav>
			{#each links as link (link.href)}
				<a href={link.href} class:active={page.url.pathname === link.href}>{link.label}</a>
			{/each}
		</nav>
		<div class="side-foot">
			<a class="gh" href={data.githubUrl} target="_blank" rel="noreferrer" title="GitHub repository">
				<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"
					><path
						fill="currentColor"
						d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
					/></svg
				>
				<span>GitHub</span>
			</a>
			<span class="ver" title="Installed app version">{data.appVersion}</span>
		</div>
	</aside>

	<div class="main-col">
		<header class="top">
			<a class="brand mobile-brand" href="/">
				<img class="brand-mark" src={favicon} alt="" width="28" height="28" />
				<span>Crag Stats</span>
				<span class="ver">{data.appVersion}</span>
			</a>
			<nav class="mobile-nav" aria-label="Primary">
				{#each links as link (link.href)}
					<a href={link.href} class:active={page.url.pathname === link.href}>{link.label}</a>
				{/each}
			</nav>
		</header>
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
	.frame {
		display: grid;
		grid-template-columns: 13.5rem minmax(0, 1fr);
		min-height: 100vh;
		max-width: 1280px;
		margin: 0 auto;
		gap: 0;
	}
	.side {
		padding: 1.25rem 0.85rem 1.25rem 1rem;
		border-right: 1px solid var(--line);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: sticky;
		top: 0;
		align-self: start;
		height: 100vh;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--accent);
		padding: 0.25rem 0.45rem;
	}
	.brand-mark {
		border-radius: 0.4rem;
		flex-shrink: 0;
	}
	.side nav {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex: 1;
	}
	.side nav a {
		padding: 0.5rem 0.65rem;
		border-radius: 0.55rem;
		color: var(--ink-muted);
		font-weight: 600;
		font-size: 0.92rem;
	}
	.side nav a:hover,
	.side nav a.active,
	.mobile-nav a:hover,
	.mobile-nav a.active {
		background: rgba(47, 93, 58, 0.12);
		color: var(--ink);
	}
	.side-foot {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		padding: 0.35rem 0.45rem;
	}
	.gh {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: var(--ink-muted);
		font-weight: 600;
		font-size: 0.85rem;
	}
	.gh:hover {
		color: var(--ink);
	}
	.ver {
		display: inline-block;
		width: fit-content;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--ink-muted);
		background: rgba(28, 36, 24, 0.06);
		border: 1px solid var(--line);
		border-radius: 0.4rem;
		padding: 0.15rem 0.45rem;
	}
	.main-col {
		padding: 1.25rem 1.25rem 3rem;
		min-width: 0;
	}
	.top {
		display: none;
		margin-bottom: 1rem;
		gap: 0.65rem;
	}
	.mobile-brand {
		padding: 0;
		margin-bottom: 0.15rem;
	}
	.mobile-brand .ver {
		margin-left: 0.15rem;
		font-family: 'Source Sans 3', 'Segoe UI', sans-serif;
		letter-spacing: 0;
	}
	.mobile-nav {
		display: flex;
		flex-wrap: nowrap;
		gap: 0.35rem;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		padding-bottom: 0.15rem;
	}
	.mobile-nav a {
		padding: 0.4rem 0.7rem;
		border-radius: 999px;
		color: var(--ink-muted);
		font-weight: 600;
		font-size: 0.85rem;
		white-space: nowrap;
		flex-shrink: 0;
	}
	footer {
		margin-top: 2.5rem;
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	footer a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	@media (max-width: 860px) {
		.frame {
			grid-template-columns: 1fr;
		}
		.side {
			display: none;
		}
		.top {
			display: flex;
			flex-direction: column;
		}
		.main-col {
			padding: 0.85rem 0.85rem 2.5rem;
		}
	}
</style>
