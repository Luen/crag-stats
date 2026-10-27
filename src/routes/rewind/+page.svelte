<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const s = $derived(data.summary);
	const year = $derived(s.year ?? data.year);
</script>

<section class="panel head">
	<h1>Rewind {year}</h1>
	<p>Your {year} climbing snapshot from your synced logbook.</p>
</section>

<section class="panel controls">
	<form method="GET" class="year-form">
		<label>
			Year
			<select name="year" value={data.year} onchange={(e) => e.currentTarget.form?.requestSubmit()}>
				{#if data.years.length === 0}
					<option value={data.year}>{data.year}</option>
				{:else}
					{#each data.years as y (y)}
						<option value={y}>{y}</option>
					{/each}
				{/if}
			</select>
		</label>
		<noscript><button type="submit">Go</button></noscript>
	</form>
</section>

<section class="stats">
	<article class="panel metric">
		<span class="label">Ascents in {year}</span>
		<strong>{s.ascents}</strong>
	</article>
	<article class="panel metric">
		<span class="label">Sends in {year}</span>
		<strong>{s.sends}</strong>
	</article>
	<article class="panel metric">
		<span class="label">Onsights in {year}</span>
		<strong>{s.onsights}</strong>
	</article>
	<article class="panel metric">
		<span class="label">Height in {year}</span>
		<strong>{s.heightKm} km</strong>
		<span class="sub">{s.heightM} m</span>
	</article>
</section>

<section class="grid">
	<article class="panel">
		<h2>Top crags of {year}</h2>
		{#if s.topCrags.length === 0}
			<p class="empty">No ascents in {s.year}.</p>
		{:else}
			<ol>
				{#each s.topCrags as c (c.crag)}
					<li>
						<a href="/logbook?crag={encodeURIComponent(c.crag)}&year={s.year}">{c.crag}</a>
						<span>{c.count}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</article>
	<article class="panel">
		<h2>Hardest send in {year}</h2>
		{#if !s.hardestSend}
			<p class="empty">No sends logged in {s.year}.</p>
		{:else}
			<p class="hard">
				{#if s.hardestSend.href}
					<a href={s.hardestSend.href} target="_blank" rel="noreferrer"
						><strong>{s.hardestSend.name}</strong></a
					>
				{:else}
					<strong>{s.hardestSend.name}</strong>
				{/if}
				{#if s.hardestSend.gradeRaw}
					· {s.hardestSend.gradeRaw}
				{/if}
			</p>
			<p class="sub">
				{#if s.hardestSend.cragName}
					<a href="/logbook?crag={encodeURIComponent(s.hardestSend.cragName)}&year={s.year}"
						>{s.hardestSend.cragName}</a
					>
					·
				{/if}
				{s.hardestSend.ascentDate}
			</p>
		{/if}
	</article>
</section>

<style>
	.head,
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.head,
	.controls {
		margin-bottom: 0.9rem;
	}
	h1,
	h2 {
		margin: 0;
	}
	.head p {
		margin: 0.35rem 0 0;
		color: var(--ink-muted);
	}
	.year-form label {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		color: var(--ink-muted);
	}
	select {
		font: inherit;
		padding: 0.4rem 0.55rem;
		border-radius: 0.45rem;
		border: 1px solid var(--line);
		background: #fff;
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.75rem;
		margin-bottom: 0.9rem;
	}
	.metric {
		display: grid;
		gap: 0.2rem;
	}
	.metric .label {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--ink-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.metric strong {
		font-size: 1.55rem;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
	}
	ol {
		list-style: none;
		margin: 0.75rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.45rem;
	}
	ol li {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
	}
	a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
	.sub,
	.empty {
		color: var(--ink-muted);
		font-size: 0.88rem;
		margin: 0.35rem 0 0;
	}
	.hard {
		margin: 0.75rem 0 0;
	}
	@media (max-width: 800px) {
		.stats,
		.grid {
			grid-template-columns: 1fr 1fr;
		}
	}
	@media (max-width: 520px) {
		.stats {
			grid-template-columns: 1fr;
		}
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
