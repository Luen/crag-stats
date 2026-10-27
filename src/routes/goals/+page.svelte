<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let kind = $state('height_year');

	function kindLabel(k: string) {
		switch (k) {
			case 'height_year':
				return 'Height / year';
			case 'days_month':
				return 'Days this month';
			case 'grade':
				return 'Grade';
			default:
				return 'Custom';
		}
	}
</script>

<section class="panel head">
	<h1>Goals</h1>
	<p>Track yearly height, monthly days out, grade targets, or custom milestones.</p>
</section>

{#if form?.message}
	<p class="banner err">{form.message}</p>
{/if}

<section class="panel form-panel">
	<h2>Add goal</h2>
	<form method="POST" action="?/create" class="form">
		<label>
			Kind
			<select name="kind" bind:value={kind}>
				<option value="height_year">Height this year (m)</option>
				<option value="days_month">Climbing days this month</option>
				<option value="grade">Send a grade (score)</option>
				<option value="custom">Custom</option>
			</select>
		</label>
		<label>
			Title
			<input name="title" required placeholder="e.g. 5 km vertical in 2026" />
		</label>
		{#if kind === 'height_year' || kind === 'days_month' || kind === 'custom'}
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
		{#if kind === 'grade'}
			<label>
				Target grade score
				<input name="targetGradeScore" type="number" step="0.5" placeholder="25" />
			</label>
		{/if}
		<button type="submit">Add</button>
	</form>
</section>

<section class="panel">
	<h2>Your goals ({data.goals.length})</h2>
	{#if data.goals.length === 0}
		<p class="empty">No goals yet.</p>
	{:else}
		<ul>
			{#each data.goals as g (g.id)}
				<li class={{ done: g.completed }}>
					<div>
						<strong>{g.title}</strong>
						<div class="sub">
							{kindLabel(g.kind)}
							{#if g.targetValue}
								· target {g.targetValue}{#if g.kind === 'height_year'}m{/if}
							{/if}
							{#if g.targetGradeScore != null}
								· score ≥ {g.targetGradeScore}
							{/if}
							{#if g.year}
								· {g.year}
							{/if}
							{#if g.progressValue != null}
								· progress {g.progressValue}{#if g.kind === 'height_year'}m{/if}
							{/if}
							{#if g.completed}
								· complete
							{/if}
						</div>
					</div>
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
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.head,
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	.head {
		margin-bottom: 0.9rem;
	}
	.form-panel {
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
		background: #fff;
		color: var(--ink);
	}
	button {
		padding: 0.45rem 0.85rem;
		border-radius: 0.5rem;
		border: 1px solid transparent;
		background: var(--accent);
		color: #fff;
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
		border-color: #c44569;
		color: #c44569;
	}
	ul {
		list-style: none;
		margin: 0.85rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}
	li {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
	}
	li.done strong {
		text-decoration: line-through;
		opacity: 0.75;
	}
	.sub,
	.empty {
		color: var(--ink-muted);
		font-size: 0.88rem;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}
	.banner.err {
		color: #c44569;
		margin: 0 0 0.75rem;
	}
</style>
