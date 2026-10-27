<script lang="ts">
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
</script>

<section class="panel">
	<h1>Crag Stats</h1>
	<p>Enter the app password to continue.</p>
	{#if form?.message}
		<p class="err" role="alert">{form.message}</p>
	{/if}
	<form method="POST">
		<input type="hidden" name="next" value={data.next} />
		<label class="sr-only" for="password">Password</label>
		<input
			id="password"
			type="password"
			name="password"
			placeholder="Password"
			required
			autocomplete="current-password"
			autocapitalize="off"
			spellcheck="false"
		/>
		<button type="submit">Unlock</button>
	</form>
</section>

<style>
	.panel {
		max-width: 24rem;
		margin: 4rem auto;
		padding: 1.5rem;
		border-radius: 1rem;
	}
	h1 {
		margin: 0;
		color: var(--accent);
	}
	p {
		color: var(--ink-muted);
	}
	form {
		display: grid;
		gap: 0.6rem;
	}
	input,
	button {
		font: inherit;
		padding: 0.65rem 0.8rem;
		border-radius: 0.55rem;
		border: 1px solid var(--line);
	}
	button {
		background: var(--accent);
		color: white;
		border: none;
		font-weight: 700;
	}
	.err {
		color: #7a1010;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
