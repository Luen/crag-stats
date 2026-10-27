<script lang="ts">
	import { tickKind } from '#lib/ticks';

	type Props = {
		tick: string | null | undefined;
		/** Show the tick label next to the icon (default true). */
		label?: boolean;
		size?: number;
	};

	let { tick, label = true, size = 16 }: Props = $props();

	const kind = $derived(tickKind(tick));
	const text = $derived((tick || '').trim() || 'Other');
</script>

<span class="tick" title={text}>
	<svg
		class="ico"
		width={size}
		height={size}
		viewBox="0 0 16 16"
		aria-hidden="true"
		focusable="false"
	>
		{#if kind === 'onsight'}
			<!-- Blue eye -->
			<ellipse cx="8" cy="8" rx="6.2" ry="3.8" fill="#1d6fa5" />
			<ellipse cx="8" cy="8" rx="3.2" ry="3.2" fill="#fff" />
			<circle cx="8" cy="8" r="1.55" fill="#1d6fa5" />
		{:else if kind === 'flash'}
			<!-- Yellow bolt, red outline -->
			<path
				d="M9.2 1.2 4.4 8.4h3.1L6.6 14.8l5.4-7.6H8.8L9.2 1.2Z"
				fill="#fee100"
				stroke="#c90909"
				stroke-width="1.15"
				stroke-linejoin="round"
			/>
		{:else if kind === 'redpoint'}
			<circle cx="8" cy="8" r="5.2" fill="#c90909" />
		{:else if kind === 'pinkpoint'}
			<circle cx="8" cy="8" r="5.2" fill="#e83e8c" />
		{:else if kind === 'tick'}
			<path
				d="M3.2 8.1 6.4 11.2 12.8 4.4"
				fill="none"
				style="stroke: var(--ink)"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{:else if kind === 'clean' || kind === 'send'}
			<path
				d="M3.2 8.1 6.4 11.2 12.8 4.4"
				fill="none"
				stroke="#54b41a"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{:else if kind === 'toprope'}
			<!-- "Top" with check over the o -->
			<text
				x="1"
				y="12.2"
				font-size="8.5"
				font-family="system-ui,Segoe UI,sans-serif"
				font-weight="700"
				style="fill: var(--ink)">Top</text
			>
			<path
				d="M8.05 2.1 9.35 3.35 11.5 1.1"
				fill="none"
				style="stroke: var(--ink)"
				stroke-width="1.35"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		{:else}
			<circle cx="8" cy="8" r="5.2" fill="#c5c5c5" />
		{/if}
	</svg>
	{#if label}
		<span class="lbl">{text}</span>
	{/if}
</span>

<style>
	.tick {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		vertical-align: middle;
		line-height: 1;
	}
	.ico {
		flex: none;
		display: block;
	}
	.lbl {
		font-size: inherit;
	}
</style>
