<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import RichText from '#lib/components/RichText.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const i18n = useI18n();

	let theme = $state<'light' | 'dark'>('light');
	let format = $state<'html' | 'markdown'>('html');
	let linkBack = $state(true);
	let copied = $state<string | null>(null);

	const dashboardUrl = $derived(`${data.origin}/`);

	function imageUrl(id: string) {
		return `${data.origin}/embed/${id}.svg${theme === 'dark' ? '?theme=dark' : ''}`;
	}

	function snippet(card: (typeof data.cards)[number]) {
		const src = imageUrl(card.id);
		if (format === 'markdown') {
			const img = `![${card.alt}](${src})`;
			return linkBack ? `[${img}](${dashboardUrl})` : img;
		}
		const img = `<img src="${src}" alt="${card.alt}" width="480" loading="lazy" />`;
		return linkBack ? `<a href="${dashboardUrl}">${img}</a>` : img;
	}

	async function copy(id: string, text: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = id;
			setTimeout(() => {
				if (copied === id) copied = null;
			}, 1800);
		} catch {
			copied = null;
		}
	}

	const canShare = $derived(typeof navigator !== 'undefined' && 'share' in navigator);

	async function shareDashboard() {
		try {
			await navigator.share({ title: i18n.t('pages.share.titleShareSheet'), url: dashboardUrl });
		} catch {
			// Dismissed, or not allowed here.
		}
	}
</script>

<section class="panel head">
	<h1>{i18n.t('pages.share.titleShareEmbed')}</h1>
	<p>
		<RichText message={i18n.t('pages.share.lead')} />
	</p>
	{#if data.privateHost}
		<p class="warn" role="note">
			<RichText
				message={i18n.t('pages.share.warnPrivateHost')}
				tokens={{ origin: { kind: 'code', text: data.origin } }}
			/>
		</p>
	{/if}
	<div class="share-row">
		<button type="button" class="primary" onclick={() => copy('link', dashboardUrl)}>
			{copied === 'link'
				? i18n.t('pages.share.buttonLinkCopied')
				: i18n.t('pages.share.buttonCopyDashboardLink')}
		</button>
		{#if canShare}
			<button type="button" class="secondary" onclick={shareDashboard}
				>{i18n.t('pages.share.buttonShare')}</button
			>
		{/if}
	</div>
</section>

<section class="panel options" aria-label={i18n.t('pages.share.ariaEmbedOptions')}>
	<fieldset>
		<legend>{i18n.t('pages.share.legendTheme')}</legend>
		<label><input type="radio" bind:group={theme} value="light" /> {i18n.t('theme.light')}</label>
		<label><input type="radio" bind:group={theme} value="dark" /> {i18n.t('theme.dark')}</label>
	</fieldset>
	<fieldset>
		<legend>{i18n.t('pages.share.legendCode')}</legend>
		<label
			><input type="radio" bind:group={format} value="html" />
			{i18n.t('pages.share.optionHtml')}</label
		>
		<label
			><input type="radio" bind:group={format} value="markdown" />
			{i18n.t('pages.share.optionMarkdown')}</label
		>
	</fieldset>
	<label class="check"
		><input type="checkbox" bind:checked={linkBack} />
		{i18n.t('pages.share.labelLinkToMyDashboard')}</label
	>
</section>

<div class="cards">
	{#each data.cards as card (card.id)}
		{@const code = snippet(card)}
		<section class="panel card">
			<h2>{card.title}</h2>
			<div class="preview" class:dark={theme === 'dark'}>
				<img src="/embed/{card.id}.svg{theme === 'dark' ? '?theme=dark' : ''}" alt={card.alt} />
			</div>
			<label class="code-label" for="code-{card.id}">{i18n.t('pages.share.labelEmbedCode')}</label>
			<textarea id="code-{card.id}" readonly rows="3" value={code}></textarea>
			<div class="card-actions">
				<button type="button" class="primary" onclick={() => copy(card.id, code)}>
					{copied === card.id
						? i18n.t('pages.share.buttonCopied')
						: i18n.t('pages.share.buttonCopyCode')}
				</button>
				<a class="secondary" href={imageUrl(card.id)} target="_blank" rel="noreferrer"
					>{i18n.t('pages.share.linkOpenImage')}</a
				>
			</div>
		</section>
	{/each}
</div>

<style>
	.head,
	.options,
	.card {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.head h1 {
		margin: 0 0 0.4rem;
	}
	.head p {
		margin: 0;
		color: var(--ink-muted);
		max-width: 62ch;
	}
	.head p.warn {
		margin-top: 0.85rem;
		padding: 0.7rem 0.85rem;
		border-radius: 0.6rem;
		border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
		background: var(--accent-soft);
		color: var(--ink);
		font-size: 0.9rem;
		max-width: 72ch;
	}
	.warn :global(code) {
		overflow-wrap: anywhere;
	}
	.share-row,
	.card-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.85rem;
	}
	.options {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.5rem;
		margin-top: 1rem;
	}
	fieldset {
		display: flex;
		gap: 0.9rem;
		border: 0;
		margin: 0;
		padding: 0;
	}
	legend {
		float: left;
		margin-right: 0.6rem;
		font-weight: 600;
	}
	label {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 32rem), 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}
	.card h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	.preview {
		display: grid;
		place-items: center;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface-3);
	}
	.preview.dark {
		background: #0f1218;
	}
	.preview img {
		max-width: 100%;
		height: auto;
	}
	.code-label {
		display: block;
		margin: 0.85rem 0 0.3rem;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--ink-muted);
	}
	textarea {
		width: 100%;
		box-sizing: border-box;
		font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
		font-size: 0.8rem;
		padding: 0.55rem 0.65rem;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: var(--surface-2);
		resize: vertical;
	}
	.primary,
	.secondary {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 0.9rem;
		border-radius: 0.55rem;
		font: inherit;
		font-weight: 600;
		font-size: 0.88rem;
		cursor: pointer;
	}
	.primary {
		background: var(--accent);
		color: var(--on-accent);
		border: 1px solid var(--accent);
	}
	.secondary {
		background: var(--paper);
		color: var(--ink);
		border: 1px solid var(--line);
	}
	.head :global(code) {
		font-size: 0.9em;
	}
</style>
