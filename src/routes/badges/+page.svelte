<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import Badges from '#lib/components/Badges.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();
</script>

<svelte:head>
	<title>{i18n.t('pages.badges.pageTitle')}</title>
	<meta name="description" content={i18n.t('pages.badges.pageDescription')} />
</svelte:head>

<section class="panel head">
	<h1>{i18n.t('pages.badges.titleBadges')}</h1>
	<p>{i18n.t('pages.badges.lead')}</p>
</section>

{#if data.badges.almost.length > 0}
	<section class="panel almost">
		<h2>{i18n.t('pages.badges.titleAlmostThere')}</h2>
		<p class="blurb">{i18n.t('pages.badges.hintAlmost')}</p>
		<ul>
			{#each data.badges.almost as a (a.id)}
				<li>
					<div class="row">
						<strong>{a.title}</strong>
						<span class="pct">{a.pct}%</span>
					</div>
					<div
						class="bar"
						role="progressbar"
						aria-valuenow={a.pct}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-label={i18n.t('pages.badges.ariaAlmostProgress', {
							title: a.title,
							current: a.current,
							target: a.target
						})}
					>
						<span style:width="{a.pct}%"></span>
					</div>
					<p class="meta">{a.current} / {a.target}</p>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<Badges
	earned={data.badges.earned}
	locked={data.badges.locked}
	earnedCount={data.badges.earnedCount}
	totalCount={data.badges.totalCount}
	titleHref={null}
	layout="grid"
/>

<style>
	.head {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
		margin-bottom: 0.85rem;
	}
	h1 {
		margin: 0 0 0.35rem;
		font-size: 1.45rem;
	}
	.head p {
		margin: 0;
		color: var(--ink-muted);
		font-size: 0.92rem;
		max-width: 42rem;
		line-height: 1.45;
	}
	.almost {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
		margin-bottom: 0.85rem;
	}
	.almost h2 {
		margin: 0 0 0.25rem;
		font-size: 1.05rem;
	}
	.almost .blurb {
		margin: 0 0 0.75rem;
		color: var(--ink-muted);
		font-size: 0.88rem;
	}
	.almost ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}
	.almost li {
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 0.65rem;
		background: var(--surface-2);
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: baseline;
	}
	.pct {
		font-weight: 700;
		color: var(--accent);
		font-size: 0.9rem;
	}
	.bar {
		margin-top: 0.45rem;
		height: 0.45rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--accent);
	}
	.meta {
		margin: 0.35rem 0 0;
		font-size: 0.82rem;
		color: var(--ink-muted);
	}
</style>
