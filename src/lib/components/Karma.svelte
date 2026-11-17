<script lang="ts">
	import { formatNumber, DEFAULT_DATE_DISPLAY, type DateDisplay } from '#lib/dates';
	import { useI18n } from '#lib/i18n';
	import type { KarmaStats } from '#lib/types/karma';

	type Props = { data: KarmaStats; dateDisplay?: DateDisplay };
	let { data, dateDisplay = DEFAULT_DATE_DISPLAY }: Props = $props();
	const i18n = useI18n();
</script>

<article class="panel">
	<header>
		<h2>{i18n.t('cards.karma.titleKarma')}</h2>
		<a class="how" href="/docs/karma">{i18n.t('common.howItWorks')}</a>
	</header>

	<p class="lead">{i18n.t('cards.karma.lead')}</p>

	<div class="tiles">
		<div class="tile">
			<strong>{formatNumber(data.totalPoints, dateDisplay)}</strong>
			<span>{i18n.t('cards.karma.ascentKarma')}</span>
		</div>
		<div class="tile">
			<strong>{formatNumber(data.routesLogged, dateDisplay)}</strong>
			<span>{i18n.t('cards.karma.routesLogged', { count: data.routesLogged })}</span>
		</div>
		<div class="tile muted">
			<strong>—</strong>
			<span>{i18n.t('cards.karma.editUnavailable')}</span>
		</div>
	</div>

	<p class="foot">
		{i18n.t('cards.karma.pointRule')}
		{#if data.ascentSource === 'account'}
			{i18n.t('cards.karma.sourceAccountBefore')}<code>routesTicked</code>{i18n.t(
				'cards.karma.sourceAccountAfter'
			)}
		{:else}
			{i18n.t('cards.karma.sourceLocal')}
		{/if}
		{i18n.t('cards.karma.queueNote')}
		<a href="https://www.thecrag.com/article/cragkarma" target="_blank" rel="noreferrer"
			>{i18n.t('cards.karma.articleLink')}</a
		>.
	</p>
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	.lead {
		margin: 0 0 0.85rem;
		color: var(--ink-muted);
		font-size: 0.9rem;
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
		gap: 0.55rem;
	}
	.tile {
		border: 1px solid var(--line);
		border-top: 3px solid var(--accent);
		border-radius: 0.65rem;
		padding: 0.65rem 0.6rem;
		text-align: center;
		background: var(--paper);
	}
	.tile.muted {
		border-top-color: var(--line);
	}
	.tile strong {
		display: block;
		font-size: 1.45rem;
		line-height: 1.15;
		font-family: var(--font-display);
	}
	.tile span {
		color: var(--ink-muted);
		font-size: 0.8rem;
	}
	.foot {
		margin: 0.85rem 0 0;
		color: var(--ink-muted);
		font-size: 0.82rem;
	}
	.foot a,
	.foot code {
		color: inherit;
	}
	.foot a {
		text-decoration: underline;
	}
</style>
