<script lang="ts">
	import { useI18n } from '#lib/i18n';

	type Share = { style: string; count: number; pct: number; color: string };
	type Props = { shares: Share[]; climberType: string };
	let { shares, climberType }: Props = $props();
	const i18n = useI18n();

	const CLIMBER_TYPE_KEYS: Record<string, string> = {
		'sport climber': 'cards.climberTypeBar.typeSport',
		'trad climber': 'cards.climberTypeBar.typeTrad',
		boulderer: 'cards.climberTypeBar.typeBoulderer',
		'boulder climber': 'cards.climberTypeBar.typeBoulderer',
		'rock climber': 'cards.climberTypeBar.typeRock'
	};

	const STYLE_KEYS: Record<string, string> = {
		sport: 'styles.sport',
		trad: 'styles.trad',
		boulder: 'styles.boulder',
		'top rope': 'styles.toprope',
		toprope: 'styles.toprope',
		'deep water solo': 'styles.deepWaterSolo',
		alpine: 'styles.alpine',
		aid: 'styles.aid',
		solo: 'styles.solo',
		unknown: 'styles.unknown',
		other: 'styles.other'
	};

	const displayClimberType = $derived.by(() => {
		const key = CLIMBER_TYPE_KEYS[(climberType || '').trim().toLowerCase()];
		return key ? i18n.t(key) : climberType;
	});

	function displayStyle(style: string): string {
		const key = STYLE_KEYS[(style || '').trim().toLowerCase()];
		return key ? i18n.t(key) : style;
	}
</script>

<article class="panel">
	<header>
		<h2>{i18n.t('cards.climberTypeBar.titleClimberType')}</h2>
		<strong class="type">{displayClimberType}</strong>
	</header>
	<p class="hint"><a href="/docs/climber-type">{i18n.t('cards.climberTypeBar.howDecided')}</a></p>
	{#if shares.length}
		<div
			class="bar"
			role="img"
			aria-label={i18n.t('cards.climberTypeBar.ariaClimbingStyleDistribution')}
		>
			{#each shares as s (s.style)}
				{@const label = displayStyle(s.style)}
				{#if s.pct >= 2}
					<span class="seg" style:flex={s.pct} style:background={s.color} title="{label}: {s.pct}%"
						>{#if s.pct >= 8}<span class="seg-label"
								><span class="seg-name">{label.toUpperCase()}</span>
								<span class="seg-pct">{Math.round(s.pct)}%</span></span
							>{/if}</span
					>
				{/if}
			{/each}
		</div>
		<ul class="legend">
			{#each shares as s (s.style)}
				<li><i style:background={s.color}></i>{displayStyle(s.style)} · {s.pct}% ({s.count})</li>
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
		gap: 1rem;
		align-items: baseline;
	}
	h2 {
		margin: 0;
		font-size: 1.2rem;
	}
	.type {
		font-family: var(--font-display);
		font-size: 1.25rem;
		color: var(--accent);
	}
	.hint {
		margin: 0.35rem 0 0.85rem;
		font-size: 0.85rem;
	}
	.hint a {
		color: var(--accent);
		font-weight: 600;
	}
	.bar {
		display: flex;
		height: 2.1rem;
		border-radius: 0.35rem;
		overflow: hidden;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
	}
	.seg {
		display: grid;
		place-items: center;
		color: white;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 0.02em;
		/* Intentional: keeps white labels legible on any discipline colour. */
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
		min-width: 0;
		overflow: hidden;
		/* Each segment is a size container so narrow ones can drop label parts. */
		container-type: inline-size;
	}
	/* Never wrap inside a segment; the legend below lists every style and share. */
	.seg-label {
		display: flex;
		gap: 0.3em;
		white-space: nowrap;
		padding: 0 0.3rem;
	}
	@container (max-width: 6.5rem) {
		.seg-name {
			display: none;
		}
	}
	@container (max-width: 2.4rem) {
		.seg-pct {
			display: none;
		}
	}
	.legend {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem 1rem;
		font-size: 0.85rem;
		color: var(--ink-muted);
	}
	.legend i {
		display: inline-block;
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 2px;
		margin-right: 0.3rem;
	}
</style>
