<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let kind = $state('grade');
	let venueScope = $state('outdoor');
</script>

{#snippet goalCard(g: (typeof data.goals)[number])}
	<article class={['goal', { done: g.completed }]}>
		<div class="goal-main">
			<div class="goal-top">
				<strong>{g.title}</strong>
				<span class="pill">{g.kindLabel}</span>
			</div>
			<p class="meta">{g.targetLabel}</p>
			<div
				class="bar"
				role="progressbar"
				aria-valuenow={g.progressPct}
				aria-valuemin={0}
				aria-valuemax={100}
			>
				<span style:width="{g.progressPct}%"></span>
			</div>
			<p class="progress-line">
				{g.progressLabel}
				<span class="pct">{g.progressPct}%</span>
			</p>
			{#if g.completed && g.achievedAt}
				<p class="achieved">Achieved {(g.achievedAt || '').slice(0, 10)}</p>
			{/if}
		</div>
		{#if data.canEdit}
			<div class="actions">
				{#if g.completed}
					<form method="POST" action="?/reopen">
						<input type="hidden" name="id" value={g.id} />
						<button type="submit" class="secondary">Reopen</button>
					</form>
				{:else}
					<form method="POST" action="?/complete">
						<input type="hidden" name="id" value={g.id} />
						<button type="submit" class="secondary">Mark complete</button>
					</form>
				{/if}
				<form method="POST" action="?/delete">
					<input type="hidden" name="id" value={g.id} />
					<button type="submit" class="danger">Delete</button>
				</form>
			</div>
		{/if}
	</article>
{/snippet}

<section class="panel head">
	<h1>Goals</h1>
	<p>
		Progress fills from your theCrag logbook. Grade goals track a send ≥ target this year (outdoor
		by default); the bar is approximate readiness from nearby distinct-route sends (~2 at one grade
		under, ~4 at two under), not best÷target. Height and days stay linear. Custom goals stay manual.
	</p>
</section>

{#if form?.message}
	<p class="banner err">{form.message}</p>
{/if}

{#if data.canEdit}
	<section class="panel form-panel">
		<h2>Add goal</h2>
		<form method="POST" action="?/create" class="form">
			<label>
				Kind
				<select name="kind" bind:value={kind}>
					<option value="grade">Grade this year (send ≥ X)</option>
					<option value="height_year">Height this year (m)</option>
					<option value="days_month">Climbing days this month</option>
					<option value="custom">Custom (manual)</option>
				</select>
			</label>
			<label>
				Title
				<input
					name="title"
					required
					placeholder={kind === 'grade'
						? 'e.g. Lead outdoor 25 this year'
						: 'e.g. 5 km vertical in 2026'}
				/>
			</label>
			<label>
				Venue
				<select name="venueScope" bind:value={venueScope}>
					<option value="outdoor">Outdoor</option>
					<option value="indoor">Indoor / gym</option>
					<option value="any">Any</option>
				</select>
			</label>
			{#if kind === 'grade'}
				<label>
					Target grade
					<input name="grade" required placeholder="25 · 7a · V5 · 5.12a" />
				</label>
				<label>
					Year
					<input name="year" type="number" value={new Date().getFullYear()} />
				</label>
			{:else if kind === 'height_year' || kind === 'days_month' || kind === 'custom'}
				<label>
					Target
					<input
						name="targetValue"
						placeholder={kind === 'height_year' ? '5000' : kind === 'days_month' ? '8' : 'anything'}
					/>
				</label>
			{/if}
			{#if kind === 'height_year'}
				<label>
					Year
					<input name="year" type="number" value={new Date().getFullYear()} />
				</label>
			{/if}
			<button type="submit">Add</button>
		</form>
	</section>
{/if}

<section class="panel">
	<div class="section-head">
		<h2>Active</h2>
		<span class="count">{data.active.length}</span>
	</div>
	{#if data.active.length === 0}
		<p class="empty">No active goals — add one above.</p>
	{:else}
		<div class="list">
			{#each data.active as g (g.id)}
				{@render goalCard(g)}
			{/each}
		</div>
	{/if}
</section>

<section class="panel achieved-panel">
	<div class="section-head">
		<h2>Achieved</h2>
		<span class="count muted">{data.achieved.length}</span>
	</div>
	{#if data.achieved.length === 0}
		<p class="empty">Completed goals land here.</p>
	{:else}
		<div class="list">
			{#each data.achieved as g (g.id)}
				{@render goalCard(g)}
			{/each}
		</div>
	{/if}
</section>

<style>
	.head,
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.head,
	.form-panel,
	.panel {
		margin-bottom: 0.9rem;
	}
	.achieved-panel {
		margin-bottom: 0;
	}
	h1,
	h2 {
		margin: 0;
	}
	.head p {
		margin: 0.35rem 0 0;
		color: var(--ink-muted);
	}
	.section-head {
		display: flex;
		align-items: baseline;
		gap: 0.55rem;
		margin-bottom: 0.75rem;
	}
	.count {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, var(--paper));
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
	}
	.count.muted {
		color: var(--ink-muted);
		background: color-mix(in srgb, var(--ink) 6%, transparent);
	}
	.form {
		display: grid;
		gap: 0.65rem;
		margin-top: 0.75rem;
		max-width: 28rem;
	}
	label {
		display: grid;
		gap: 0.25rem;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--ink-muted);
	}
	input,
	select,
	button {
		font: inherit;
	}
	input,
	select {
		padding: 0.45rem 0.55rem;
		border-radius: 0.45rem;
		border: 1px solid var(--line);
		background: var(--paper);
		color: var(--ink);
	}
	button {
		padding: 0.45rem 0.85rem;
		border-radius: 0.5rem;
		border: 1px solid transparent;
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 600;
		cursor: pointer;
		width: fit-content;
	}
	button.secondary {
		background: transparent;
		border-color: var(--line);
		color: var(--ink);
	}
	button.danger {
		background: transparent;
		border-color: var(--danger);
		color: var(--danger);
	}
	.list {
		display: grid;
		gap: 0.75rem;
	}
	.goal {
		display: flex;
		justify-content: space-between;
		gap: 0.85rem;
		align-items: flex-start;
		flex-wrap: wrap;
		padding: 0.85rem 0.9rem;
		border: 1px solid var(--line);
		border-radius: 0.75rem;
		background: var(--surface-2);
	}
	.goal.done {
		opacity: 0.88;
	}
	.goal-main {
		flex: 1 1 14rem;
		min-width: 0;
	}
	.goal-top {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		align-items: center;
	}
	.pill {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--ink-muted);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 0.1rem 0.45rem;
	}
	.meta,
	.progress-line,
	.achieved,
	.empty {
		color: var(--ink-muted);
		font-size: 0.88rem;
	}
	.meta {
		margin: 0.35rem 0 0.55rem;
	}
	.bar {
		height: 0.55rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--ink) 8%, transparent);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--accent);
		min-width: 0;
	}
	.goal.done .bar span {
		background: var(--accent-strong);
	}
	.progress-line {
		display: flex;
		justify-content: space-between;
		margin: 0.4rem 0 0;
	}
	.pct {
		font-weight: 700;
		color: var(--ink);
	}
	.achieved {
		margin: 0.25rem 0 0;
		font-size: 0.8rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.banner.err {
		color: var(--danger);
		margin: 0 0 0.75rem;
	}
</style>
