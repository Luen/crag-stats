<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import '../app.css';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/logbook', label: 'Logbook' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/settings', label: 'Settings' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Crag Stats</title>
</svelte:head>

<div class="shell">
	<header class="top">
		<a class="brand" href="/">Crag Stats</a>
		<nav>
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
		</p>
	</footer>
</div>

<style>
	.shell {
		max-width: 1120px;
		margin: 0 auto;
		padding: 1.25rem 1.25rem 3rem;
	}
	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.75rem;
	}
	.brand {
		font-size: clamp(1.7rem, 3vw, 2.2rem);
		font-weight: 700;
		color: var(--accent);
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	nav a {
		padding: 0.45rem 0.8rem;
		border-radius: 999px;
		color: var(--ink-muted);
		font-weight: 600;
		font-size: 0.95rem;
	}
	nav a:hover,
	nav a.active {
		background: rgba(47, 93, 58, 0.12);
		color: var(--ink);
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
</style>
