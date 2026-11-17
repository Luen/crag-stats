<script lang="ts">
	import { useI18n } from '#lib/i18n';
	import { formatCalendarDate } from '#lib/dates';
	import { heightUnitLabel } from '#lib/units';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const i18n = useI18n();

	let kind = $state('grade');
	let venueScope = $state('outdoor');
	const heightUnit = $derived(heightUnitLabel(data.displayUnits.height));
	const heightPlaceholder = $derived(heightUnit === 'ft' ? '16404' : '5000');
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
				aria-label={i18n.t('pages.goals.ariaGoalProgress', { title: g.title })}
			>
				<span style:width="{g.progressPct}%"></span>
			</div>
			<p class="progress-line">
				{g.progressLabel}
				<span class="pct">{g.progressPct}%</span>
			</p>
			{#if data.canEdit && g.kind === 'grade'}
				<details>
					<summary
						>{g.gradeScale
							? i18n.t('pages.goals.summaryGradePreferences')
							: i18n.t('pages.goals.summaryChooseGradeScale')}</summary
					>
					<form method="POST" action="?/scale" class="scale-form">
						<input type="hidden" name="id" value={g.id} />
						<label>
							{i18n.t('pages.goals.labelGradeScale')}
							<select name="gradeScale" required value={g.gradeScale ?? ''}>
								<option value="" disabled>{i18n.t('pages.goals.optionChooseAScale')}</option>
								<option value="route">{i18n.t('pages.goals.optionRoutes')}</option>
								<option value="boulder">{i18n.t('pages.goals.optionBoulders')}</option>
							</select>
						</label>
						<label>
							<input type="checkbox" name="suggested" value="1" checked={g.suggested} />
							{i18n.t('pages.goals.labelUseAutomaticGoalTitle')}
						</label>
						<button type="submit">{i18n.t('pages.goals.buttonSaveGradePreferences')}</button>
					</form>
				</details>
			{/if}
			{#if g.completed && g.achievedAt}
				<p class="achieved">
					{i18n.t('pages.goals.labelAchievedOn', {
						date: formatCalendarDate(g.achievedAt, data.dateDisplay)
					})}
				</p>
			{/if}
		</div>
		{#if data.canEdit}
			<div class="actions">
				{#if g.completed}
					<form method="POST" action="?/reopen">
						<input type="hidden" name="id" value={g.id} />
						<button type="submit" class="secondary">{i18n.t('pages.goals.buttonReopen')}</button>
					</form>
				{:else}
					<form method="POST" action="?/complete">
						<input type="hidden" name="id" value={g.id} />
						<button type="submit" class="secondary"
							>{i18n.t('pages.goals.buttonMarkComplete')}</button
						>
					</form>
				{/if}
				<form method="POST" action="?/delete">
					<input type="hidden" name="id" value={g.id} />
					<button type="submit" class="danger">{i18n.t('common.delete')}</button>
				</form>
			</div>
		{/if}
	</article>
{/snippet}

<section class="panel head">
	<h1>{i18n.t('pages.goals.titleGoals')}</h1>
	<p>
		{i18n.t('pages.goals.lead')}
		<a class="how" href="/docs/goals">{i18n.t('common.howItWorks')}</a>
	</p>
</section>

{#if form?.message}
	<p class="banner err">{form.message}</p>
{/if}

{#if data.suggestions.length > 0}
	<section class="panel suggest-panel">
		<h2>{i18n.t('pages.goals.titleSuggested')}</h2>
		<p class="suggest-intro">
			{i18n.t('pages.goals.hintSuggested')}
		</p>
		<ul class="suggest-list">
			{#each data.suggestions as s (s.family)}
				<li class="suggest">
					<div>
						<strong>{s.title}</strong>
						<p>{s.blurb}</p>
					</div>
					{#if s.alreadyTracking}
						<span class="tracking">{i18n.t('pages.goals.labelAlreadyTracking')}</span>
					{:else if data.canEdit}
						<form method="POST" action="?/create">
							<input type="hidden" name="kind" value="grade" />
							<input type="hidden" name="gradeScale" value={s.family} />
							<input type="hidden" name="suggested" value="1" />
							<input type="hidden" name="title" value={s.title} />
							<input type="hidden" name="venueScope" value={s.venueScope} />
							<input type="hidden" name="year" value={s.year} />
							<input type="hidden" name="targetGradeScore" value={s.targetScore} />
							<input type="hidden" name="grade" value={s.targetLabel} />
							<button type="submit">{i18n.t('pages.goals.buttonAddGoal')}</button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if data.canEdit}
	<section class="panel form-panel">
		<h2>{i18n.t('pages.goals.titleAddGoal')}</h2>
		<form method="POST" action="?/create" class="form">
			<label>
				{i18n.t('pages.goals.labelKind')}
				<select name="kind" bind:value={kind}>
					<option value="grade">{i18n.t('pages.goals.optionGradeThisYearSendX')}</option>
					<option value="height_year"
						>{i18n.t('pages.goals.optionHeightThisYear', { unit: heightUnit })}</option
					>
					<option value="days_month">{i18n.t('pages.goals.optionClimbingDaysThisMonth')}</option>
					<option value="custom">{i18n.t('pages.goals.optionCustomManual')}</option>
				</select>
			</label>
			<label>
				{i18n.t('pages.goals.labelTitle')}
				<input
					name="title"
					required
					placeholder={kind === 'grade'
						? i18n.t('pages.goals.placeholderTitleGradeExample')
						: kind === 'height_year'
							? i18n.t('pages.goals.placeholderTitleHeightExample', {
									value: heightPlaceholder,
									unit: heightUnit
								})
							: i18n.t('pages.goals.placeholderTitleExample')}
				/>
			</label>
			<label>
				{i18n.t('pages.goals.labelVenue')}
				<select name="venueScope" bind:value={venueScope}>
					<option value="outdoor">{i18n.t('pages.goals.optionOutdoor')}</option>
					<option value="indoor">{i18n.t('pages.goals.optionIndoorGym')}</option>
					<option value="any">{i18n.t('pages.goals.optionAny')}</option>
				</select>
			</label>
			{#if kind === 'grade'}
				<label>
					{i18n.t('pages.goals.labelGradeScale')}
					<select name="gradeScale">
						<option value="route">{i18n.t('pages.goals.optionRoutes')}</option>
						<option value="boulder">{i18n.t('pages.goals.optionBoulders')}</option>
					</select>
				</label>
				<label>
					{i18n.t('pages.goals.labelTargetGrade')}
					<input
						name="grade"
						required
						placeholder={i18n.t('pages.goals.placeholderGradeExamples')}
					/>
				</label>
				<label>
					{i18n.t('pages.goals.labelYear')}
					<input name="year" type="number" value={new Date().getFullYear()} />
				</label>
			{:else if kind === 'height_year' || kind === 'days_month' || kind === 'custom'}
				<label>
					{kind === 'height_year'
						? i18n.t('pages.goals.labelTargetHeight', { unit: heightUnit })
						: i18n.t('pages.goals.labelTarget')}
					<input
						name="targetValue"
						placeholder={kind === 'height_year'
							? heightPlaceholder
							: kind === 'days_month'
								? '8'
								: i18n.t('pages.goals.placeholderTargetCustom')}
					/>
				</label>
				{#if kind === 'height_year'}
					<input type="hidden" name="heightUnit" value={heightUnit} />
				{/if}
			{/if}
			{#if kind === 'height_year'}
				<label>
					{i18n.t('pages.goals.labelYear')}
					<input name="year" type="number" value={new Date().getFullYear()} />
				</label>
			{/if}
			<button type="submit">{i18n.t('pages.goals.buttonAdd')}</button>
		</form>
	</section>
{/if}

<section class="panel">
	<div class="section-head">
		<h2>{i18n.t('pages.goals.titleActive')}</h2>
		<span class="count">{data.active.length}</span>
	</div>
	{#if data.active.length === 0}
		<p class="empty">{i18n.t('pages.goals.emptyNoActiveGoals')}</p>
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
		<h2>{i18n.t('pages.goals.titleAchieved')}</h2>
		<span class="count muted">{data.achieved.length}</span>
	</div>
	{#if data.achieved.length === 0}
		<p class="empty">{i18n.t('pages.goals.emptyCompletedGoalsLandHere')}</p>
	{:else}
		<div class="list">
			{#each data.achieved as g (g.id)}
				{@render goalCard(g)}
			{/each}
		</div>
	{/if}
</section>

<style>
	.scale-form {
		display: grid;
		gap: 0.65rem;
		margin: 0.75rem 0;
		max-width: 28rem;
	}
	.scale-form input[type='checkbox'] {
		width: auto;
		justify-self: start;
	}
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
	.head a:not(.how) {
		font-weight: 600;
		color: var(--accent);
		text-decoration: none;
	}
	.head a:not(.how):hover {
		text-decoration: underline;
		text-underline-offset: 2px;
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
		color: var(--ink);
	}
	.suggest-panel h2 {
		margin: 0 0 0.35rem;
	}
	.suggest-intro {
		margin: 0 0 0.75rem;
		color: var(--ink-muted);
		font-size: 0.9rem;
		max-width: 40rem;
		line-height: 1.45;
	}
	.suggest-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.65rem;
	}
	.suggest {
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
	.suggest p {
		margin: 0.35rem 0 0;
		color: var(--ink-muted);
		font-size: 0.88rem;
		line-height: 1.4;
		max-width: 36rem;
	}
	.tracking {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--ink-muted);
		white-space: nowrap;
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
		opacity: 1;
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
