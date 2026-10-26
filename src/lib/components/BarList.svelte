<script lang="ts">
	type Item = { label: string; value: number; color?: string; meta?: string; href?: string | null };

	type Props = {
		items: Item[];
		maxBars?: number;
	};

	let { items, maxBars = 12 }: Props = $props();

	const visible = $derived(items.slice(0, maxBars));
	const max = $derived(Math.max(1, ...visible.map((i) => i.value)));
</script>

<ul class="bars">
	{#each visible as item (item.label)}
		<li>
			<div class="row">
				<span class="label">
					{#if item.href}
						<a href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
					{:else}
						{item.label}
					{/if}
				</span>
				<span class="value"
					>{item.value}{#if item.meta}<span class="meta"> · {item.meta}</span>{/if}</span
				>
			</div>
			<div class="track">
				<div
					class="fill"
					style:width="{(item.value / max) * 100}%"
					style:background={item.color ?? 'var(--accent)'}
				></div>
			</div>
		</li>
	{/each}
</ul>

<style>
	.bars {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.7rem;
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		font-size: 0.92rem;
	}
	.label {
		font-weight: 600;
	}
	.label a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.value {
		color: var(--ink-muted);
	}
	.meta {
		opacity: 0.8;
	}
	.track {
		height: 0.45rem;
		border-radius: 999px;
		background: rgba(28, 36, 24, 0.08);
		overflow: hidden;
		margin-top: 0.25rem;
	}
	.fill {
		height: 100%;
		border-radius: inherit;
		transition: width 400ms ease;
	}
</style>
