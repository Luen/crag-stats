<script lang="ts">
	type Badge = {
		id: string;
		title: string;
		hint: string;
		icon: string;
		tone: string;
		earned: boolean;
		detail: string | null;
		date: string | null;
		routeName: string | null;
		href: string | null;
	};

	type Props = {
		earned: Badge[];
		locked: Badge[];
		earnedCount: number;
		totalCount: number;
	};

	let { earned, locked, earnedCount, totalCount }: Props = $props();

	const cards = $derived([...earned, ...locked]);

	let scroller: HTMLDivElement | undefined = $state();

	function scrollBy(dir: 1 | -1) {
		scroller?.scrollBy({ left: dir * 240, behavior: 'smooth' });
	}

	const paths: Record<string, string> = {
		carabiner:
			'M8 7a4 4 0 0 1 8 0v2h1.5a1.5 1.5 0 0 1 0 3H16v2a4 4 0 0 1-8 0v-2H6.5a1.5 1.5 0 0 1 0-3H8V7zm2 0v2h4V7a2 2 0 1 0-4 0zm0 10a2 2 0 1 0 4 0v-2h-4v2z',
		knot: 'M12 3c-2.5 0-4 1.8-4 4 0 1.5.7 2.6 1.8 3.4L7 14.5 9.5 16l2-3.2c.2 0 .3.1.5.1.2 0 .3 0 .5-.1l2 3.2L17 14.5 14.2 10.4C15.3 9.6 16 8.5 16 7c0-2.2-1.5-4-4-4zm0 2c1.2 0 2 .9 2 2s-.8 2-2 2-2-.9-2-2 .8-2 2-2z',
		sun: 'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0-4v2m0 14v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2m14 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
		bolt: 'M13 2L4 14h7l-1 8 10-14h-7l1-6z',
		eye: 'M12 6c-5 0-9 4.5-10 6 1 1.5 5 6 10 6s9-4.5 10-6c-1-1.5-5-6-10-6zm0 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
		flag: 'M5 3v18M5 4h11l-2 3 2 3H5',
		mountain: 'M2 20L9 6l3 6 2-3 8 11H2z',
		star: 'M12 3.6l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 16.9l-4.8 2.52.92-5.34-3.88-3.78 5.36-.78L12 3.6z',
		calendar:
			'M7 3v2m10-2v2M4 8h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
		globe:
			'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 0c2.5 2.5 4 5.5 4 9s-1.5 6.5-4 9m0-18c-2.5 2.5-4 5.5-4 9s1.5 6.5 4 9M3 12h18',
		route:
			'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0-4V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2m0 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z',
		send: 'M12 3l7 7-1.4 1.4L13 7.8V21h-2V7.8L6.4 11.4 5 10l7-7z'
	};
</script>

<article class="panel">
	<header class="head">
		<div>
			<h2>Badges</h2>
			<p class="blurb">Real milestones from your logbook. Breaks do not erase them.</p>
		</div>
		<span class="progress">{earnedCount} of {totalCount} earned</span>
	</header>

	{#if cards.length === 0}
		<p class="empty">No badges yet — keep ticking.</p>
	{:else}
		<div class="rail">
			<button
				type="button"
				class="nav prev"
				onclick={() => scrollBy(-1)}
				aria-label="Scroll badges left">‹</button
			>
			<div class="scroller" bind:this={scroller}>
				{#each cards as b (b.id)}
					<article class={['card', { locked: !b.earned }]} data-tone={b.tone}>
						<div class="icon" aria-hidden="true">
							<svg
								viewBox="0 0 24 24"
								width="28"
								height="28"
								fill="none"
								stroke="currentColor"
								stroke-width="1.6"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								{#if b.icon === 'bolt' || b.icon === 'star' || b.icon === 'send'}
									<path d={paths[b.icon]} fill="currentColor" stroke="none"></path>
								{:else}
									<path d={paths[b.icon] || paths.star}></path>
								{/if}
							</svg>
						</div>
						<h3>{b.title}</h3>
						<p class="detail">
							{#if b.earned}
								{b.detail}
							{:else}
								{b.hint}
							{/if}
						</p>
						{#if b.earned && b.href}
							<a class="link" href={b.href} target="_blank" rel="noreferrer">View climb</a>
						{:else if b.earned}
							<span class="link muted">Earned</span>
						{:else}
							<span class="link muted">Locked</span>
						{/if}
					</article>
				{/each}
			</div>
			<button
				type="button"
				class="nav next"
				onclick={() => scrollBy(1)}
				aria-label="Scroll badges right">›</button
			>
		</div>
	{/if}
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.85rem;
	}
	h2 {
		margin: 0;
		font-size: 1.15rem;
	}
	.blurb {
		margin: 0.25rem 0 0;
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.progress {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--ink-muted);
		white-space: nowrap;
	}
	.rail {
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.35rem;
	}
	.scroller {
		display: flex;
		gap: 0.75rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		padding: 0.15rem 0.1rem 0.45rem;
	}
	.nav {
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--paper);
		color: var(--ink);
		font-size: 1.25rem;
		line-height: 1;
		cursor: pointer;
		flex-shrink: 0;
	}
	.nav:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.card {
		flex: 0 0 11.5rem;
		scroll-snap-align: start;
		border: 1px solid var(--line);
		border-radius: 0.85rem;
		padding: 0.9rem 0.85rem 0.75rem;
		background: var(--surface-2);
		display: grid;
		grid-template-rows: auto auto 1fr auto;
		gap: 0.35rem;
		min-height: 11.5rem;
	}
	.card.locked {
		opacity: 0.55;
		filter: grayscale(0.35);
	}
	.icon {
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 999px;
		display: grid;
		place-items: center;
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 14%, var(--paper));
	}
	.card[data-tone='warm'] .icon {
		color: #c45c26;
		background: rgba(196, 92, 38, 0.14);
	}
	.card[data-tone='green'] .icon {
		color: #2f5d3a;
		background: color-mix(in srgb, var(--accent) 14%, transparent);
	}
	.card[data-tone='blue'] .icon {
		color: #1d6fa5;
		background: rgba(29, 111, 165, 0.14);
	}
	.card[data-tone='purple'] .icon {
		color: #7b5ea7;
		background: rgba(123, 94, 167, 0.14);
	}
	h3 {
		margin: 0;
		font-size: 0.95rem;
		font-family: var(--font-display);
	}
	.detail {
		margin: 0;
		font-size: 0.8rem;
		color: var(--ink-muted);
		line-height: 1.35;
	}
	.link {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--accent);
		text-decoration: none;
		margin-top: 0.15rem;
	}
	.link:hover {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.link.muted {
		color: var(--ink-muted);
		font-weight: 500;
	}
	.empty {
		margin: 0;
		color: var(--ink-muted);
	}
	@media (max-width: 640px) {
		.head {
			flex-direction: column;
			gap: 0.35rem;
		}
		.nav {
			display: none;
		}
		.rail {
			grid-template-columns: 1fr;
		}
	}
</style>
