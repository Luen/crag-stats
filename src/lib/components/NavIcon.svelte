<script lang="ts" module>
	export type NavIconName =
		| 'dashboard'
		| 'logbook'
		| 'projects'
		| 'sectors'
		| 'partners'
		| 'goals'
		| 'eddington'
		| 'milestones'
		| 'rewind'
		| 'settings'
		| 'home'
		| 'sidebar'
		| 'github'
		| 'sun'
		| 'moon'
		| 'monitor'
		| 'docs'
		| 'logout'
		| 'share'
		| 'badges';
</script>

<script lang="ts">
	/** Outline UI icons (Lucide-style, 24px grid) for the app shell. */
	let { name, size = 20 }: { name: NavIconName; size?: number } = $props();
</script>

{#if name === 'github'}
	<svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true"
		><path
			fill="currentColor"
			d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"
		/></svg
	>
{:else}
	<svg
		viewBox="0 0 24 24"
		width={size}
		height={size}
		fill="none"
		stroke="currentColor"
		stroke-width="1.8"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		{#if name === 'dashboard'}
			<rect x="3" y="3" width="7" height="9" rx="1.5" />
			<rect x="14" y="3" width="7" height="5" rx="1.5" />
			<rect x="14" y="12" width="7" height="9" rx="1.5" />
			<rect x="3" y="16" width="7" height="5" rx="1.5" />
		{:else if name === 'logbook'}
			<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
			<path d="M9 7h7M9 11h5" />
		{:else if name === 'projects'}
			<!-- Quickdraw: two carabiners on a dogbone -->
			<path d="M8 3a3 3 0 0 0-3 3v3a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" />
			<path d="M16 12a3 3 0 0 0-3 3v3a3 3 0 0 0 6 0v-3a3 3 0 0 0-3-3Z" />
			<path d="M9.5 10.5 14.5 13.5" />
		{:else if name === 'sectors'}
			<path d="m3 20 6-12 4 7 2-3 6 8Z" />
			<circle cx="17" cy="6" r="2" />
		{:else if name === 'partners'}
			<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<circle cx="9" cy="7" r="4" />
			<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<path d="M16 3.13a4 4 0 0 1 0 7.75" />
		{:else if name === 'goals'}
			<circle cx="12" cy="12" r="9" />
			<circle cx="12" cy="12" r="5" />
			<circle cx="12" cy="12" r="1.2" fill="currentColor" />
		{:else if name === 'eddington'}
			<path d="M4 20V4M4 20h16M8 16V8M12 16V6M16 16v-4" />
		{:else if name === 'milestones'}
			<path d="M8 21h8" />
			<path d="M12 17v4" />
			<path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
			<path d="M7 4H4v2a3 3 0 0 0 3 3" />
			<path d="M17 4h3v2a3 3 0 0 1-3 3" />
		{:else if name === 'rewind'}
			<path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
			<path d="M3 3v5h5" />
			<path d="M12 7v5l3 2" />
		{:else if name === 'settings'}
			<path
				d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.6a2 2 0 0 1-1 1.7l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.7v-.6a2 2 0 0 1 1-1.7l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2Z"
			/>
			<circle cx="12" cy="12" r="3" />
		{:else if name === 'home'}
			<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />
		{:else if name === 'sidebar'}
			<rect x="3" y="3" width="18" height="18" rx="2.5" />
			<path d="M9 3v18" />
		{:else if name === 'sun'}
			<circle cx="12" cy="12" r="4" />
			<path
				d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
			/>
		{:else if name === 'moon'}
			<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
		{:else if name === 'docs'}
			<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z" />
			<path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z" />
		{:else if name === 'monitor'}
			<rect x="3" y="4" width="18" height="12" rx="2" />
			<path d="M8 20h8M12 16v4" />
		{:else if name === 'logout'}
			<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
			<path d="m16 17 5-5-5-5M21 12H9" />
		{:else if name === 'share'}
			<circle cx="18" cy="5" r="3" />
			<circle cx="6" cy="12" r="3" />
			<circle cx="18" cy="19" r="3" />
			<path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
		{:else if name === 'badges'}
			<path
				d="M12 3.6l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 16.9l-4.8 2.52.92-5.34-3.88-3.78 5.36-.78L12 3.6z"
			/>
		{/if}
	</svg>
{/if}
