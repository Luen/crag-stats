<script lang="ts">
	type WindowStats = {
		ascents: number;
		sends: number;
		activeDays: number;
		heightM: number;
	};

	type Props = {
		last7: WindowStats;
		last28: WindowStats;
		sendRate7: number;
		sendRate28: number;
		restDays7: number;
		restDays28: number;
	};

	let { last7, last28, sendRate7, sendRate28, restDays7, restDays28 }: Props = $props();

	/** sendRate is already 0–100 from analytics */
	function pct(n: number): string {
		return `${Math.round(n)}%`;
	}
</script>

<article class="panel">
	<h2>Training load</h2>
	<div class="cols">
		<section>
			<h3>Last 7 days</h3>
			<dl>
				<div>
					<dt>Ascents</dt>
					<dd>{last7.ascents}</dd>
				</div>
				<div>
					<dt>Sends</dt>
					<dd>{last7.sends}</dd>
				</div>
				<div>
					<dt>Active days</dt>
					<dd>{last7.activeDays}</dd>
				</div>
				<div>
					<dt>Rest days</dt>
					<dd>{restDays7}</dd>
				</div>
				<div>
					<dt>Height</dt>
					<dd>{Math.round(last7.heightM)} m</dd>
				</div>
				<div>
					<dt>Send rate</dt>
					<dd>{pct(sendRate7)}</dd>
				</div>
			</dl>
		</section>
		<section>
			<h3>Last 28 days</h3>
			<dl>
				<div>
					<dt>Ascents</dt>
					<dd>{last28.ascents}</dd>
				</div>
				<div>
					<dt>Sends</dt>
					<dd>{last28.sends}</dd>
				</div>
				<div>
					<dt>Active days</dt>
					<dd>{last28.activeDays}</dd>
				</div>
				<div>
					<dt>Rest days</dt>
					<dd>{restDays28}</dd>
				</div>
				<div>
					<dt>Height</dt>
					<dd>{Math.round(last28.heightM)} m</dd>
				</div>
				<div>
					<dt>Send rate</dt>
					<dd>{pct(sendRate28)}</dd>
				</div>
			</dl>
		</section>
	</div>
</article>

<style>
	.panel {
		padding: 1.1rem 1.2rem;
		border-radius: 1rem;
	}
	h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.85rem;
	}
	@media (max-width: 520px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
	h3 {
		margin: 0 0 0.55rem;
		font-size: 0.85rem;
		color: var(--ink-muted);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	dl {
		margin: 0;
		display: grid;
		gap: 0.4rem;
	}
	dl > div {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.35rem 0;
		border-bottom: 1px solid var(--line);
		font-size: 0.92rem;
	}
	dl > div:last-child {
		border-bottom: none;
	}
	dt {
		color: var(--ink-muted);
	}
	dd {
		margin: 0;
		font-weight: 600;
		font-family: var(--font-display);
	}
</style>
