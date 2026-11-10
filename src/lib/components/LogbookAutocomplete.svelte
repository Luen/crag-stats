<script lang="ts">
	import { matchingSuggestions, type LogbookSuggestion } from '#lib/logbookSuggestions';
	let {
		name,
		label,
		value = '',
		keyName = '',
		keyValue = '',
		options
	}: {
		name: string;
		label: string;
		value?: string;
		keyName?: string;
		keyValue?: string;
		options: LogbookSuggestion[];
	} = $props();
	const id = $props.id();
	let text = $derived(value);
	let selectedKey = $derived(keyValue);
	let open = $state(false);
	let active = $state(-1);
	let matches = $derived(matchingSuggestions(options, text));
	let visible = $derived(matches.slice(0, 30));
	function select(option: LogbookSuggestion) {
		text = option.value;
		selectedKey = option.key ?? '';
		open = false;
		active = -1;
		document.getElementById(id)?.focus();
	}
	function keydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			open = false;
			active = -1;
		} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			open = true;
			if (visible.length)
				active =
					active < 0
						? event.key === 'ArrowDown'
							? 0
							: visible.length - 1
						: (active + (event.key === 'ArrowDown' ? 1 : -1) + visible.length) % visible.length;
			document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' });
		} else if (event.key === 'Enter' && open && active >= 0 && visible[active]) {
			event.preventDefault();
			select(visible[active]);
		}
	}
</script>

<div class="autocomplete">
	<label for={id}>{label}</label>
	<input
		{id}
		{name}
		value={text}
		role="combobox"
		aria-autocomplete="list"
		aria-expanded={open}
		aria-controls={`${id}-list`}
		aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
		autocomplete="off"
		onfocus={() => {
			open = true;
		}}
		onblur={() => {
			open = false;
			active = -1;
		}}
		oninput={(event) => {
			text = event.currentTarget.value;
			selectedKey = '';
			open = true;
			active = -1;
		}}
		onkeydown={keydown}
	/>
	{#if keyName}<input type="hidden" name={keyName} value={selectedKey} />{/if}
	{#if open}
		<div class="popup">
			<div id={`${id}-list`} role="listbox" aria-label={`${label} suggestions`}>
				{#each visible as option, index (option.key ?? option.value)}
					<!-- svelte-ignore a11y_interactive_supports_focus, a11y_click_events_have_key_events -->
					<div
						id={`${id}-${index}`}
						role="option"
						aria-selected={index === active}
						onpointerdown={(event) => {
							event.preventDefault();
							select(option);
						}}
						onclick={() => select(option)}
					>
						{option.label}
					</div>
				{/each}
			</div>
			<p role="status">
				{visible.length
					? `${matches.length} suggestions${matches.length > 30 ? ' — type more to narrow the list' : ''}.`
					: 'No cached matches. You can still search this text.'}
			</p>
		</div>
	{/if}
</div>

<style>
	.autocomplete {
		position: relative;
		flex: 1 1 12rem;
		min-width: 0;
	}
	label {
		display: block;
		font-size: 0.8rem;
		color: var(--ink-muted);
		margin-bottom: 0.25rem;
	}
	input {
		width: 100%;
		min-width: 0;
	}
	.popup {
		position: absolute;
		z-index: 10;
		top: 100%;
		left: 0;
		width: 100%;
		box-sizing: border-box;
		max-height: 18rem;
		overflow-y: auto;
		border: 1px solid var(--line);
		border-radius: 0.5rem;
		background: var(--paper);
		box-shadow: var(--shadow);
	}
	[role='option'] {
		padding: 0.65rem;
		cursor: pointer;
		overflow-wrap: anywhere;
	}
	[role='option']:hover,
	[aria-selected='true'] {
		background: var(--surface-2);
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	p {
		padding: 0.5rem;
		margin: 0;
		font-size: 0.8rem;
		color: var(--ink-muted);
	}
</style>
