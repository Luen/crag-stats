/**
 * Private ascent notes (theCrag `markdown` → ascents.comment). theCrag has no public/private
 * flag on them, and a supporter API key returns private ones, so every note is private.
 * Hidden by default; the owner opts in with Settings or SHOW_PRIVATE_NOTES.
 */

export type ShowNotes = { enabled: boolean; source: 'settings' | 'env' | 'default' };

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

/** Settings value ('on' / 'off') wins, then SHOW_PRIVATE_NOTES, then off. */
export function resolveShowNotes(input: { stored: string | null; envValue: string }): ShowNotes {
	if (input.stored === 'on' || input.stored === 'off') {
		return { enabled: input.stored === 'on', source: 'settings' };
	}
	const raw = input.envValue.trim().toLowerCase();
	if (raw) return { enabled: TRUTHY.has(raw), source: 'env' };
	return { enabled: false, source: 'default' };
}

/**
 * Notes reach a viewer only when enabled and the viewer could open Settings
 * (`locals.authed`: no APP_PASSWORD, or signed in). Visitors never see them.
 */
export function notesVisible(enabled: boolean, viewerIsAdmin: boolean): boolean {
	return enabled && viewerIsAdmin;
}
