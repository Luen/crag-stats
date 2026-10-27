<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { PageProps } from './$types';
	let { data, form }: PageProps = $props();
</script>

<section class="panel">
	<div class="brand">
		<img src={favicon} alt="" width="52" height="52" />
		<h1>Crag<span>Stats</span></h1>
	</div>
	<p class="lede">Enter the app password to continue.</p>
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
		padding: 2rem 1.75rem 1.75rem;
		border-radius: 1rem;
	}
	/* Same lockup as the header: mark + "Crag" in ink, "Stats" in accent. */
	.brand {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}
	h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 800;
		letter-spacing: -0.03em;
		color: var(--ink);
	}
	h1 span {
		color: var(--accent);
		margin-left: 0.2em;
	}
	p {
		color: var(--ink-muted);
	}
	.lede {
		text-align: center;
		margin: 0.4rem 0 1.25rem;
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
		color: #fff;
		border: none;
		font-weight: 700;
		cursor: pointer;
	}
	button:hover {
		background: var(--accent-strong);
	}
	.err {
		color: var(--band-expert);
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
