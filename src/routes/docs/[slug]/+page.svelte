<script lang="ts">
	import DocContent from '../DocContent.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<article class="panel">
	<DocContent doc={data.doc} />
</article>

<style>
	.panel {
		padding: 1.5rem 1.75rem;
		border-radius: 1rem;
		min-width: 0;
	}
	@media (max-width: 600px) {
		.panel {
			padding: 1.1rem 1rem;
		}
	}
</style>
