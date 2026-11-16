<script lang="ts">
	import { parseRichText, type RichNode, type RichToken } from '#lib/richText';

	type Props = {
		/** A translated sentence, optionally using `**bold**`, `*italic*`, `` `code` ``, or `{name}`. */
		message: string;
		/** Element and text for each token name the message uses. */
		tokens?: Record<string, RichToken>;
	};

	let { message, tokens = {} }: Props = $props();

	const nodes = $derived(parseRichText(message, tokens));
</script>

{#snippet render(
	list: RichNode[]
)}{#each list as node (node.key)}{#if node.kind === 'text'}{node.text}{:else if node.kind === 'strong'}<strong
				>{@render render(node.children)}</strong
			>{:else if node.kind === 'em'}<em>{@render render(node.children)}</em
			>{:else if node.kind === 'link'}<a
				href={node.href}
				target={node.external ? '_blank' : undefined}
				rel={node.external ? 'noreferrer' : undefined}>{@render render(node.children)}</a
			>{:else}<code>{@render render(node.children)}</code>{/if}{/each}{/snippet}

{@render render(nodes)}
