/**
 * Private ascent notes (theCrag `markdown` → ascents.comment). theCrag has no public/private
 * flag on them, and a supporter API key returns private ones, so every note is private.
 * Hidden by default; the owner opts in in Settings.
 */

export type ShowNotes = { enabled: boolean; source: 'settings' | 'default' };

/** Settings value ('on' / 'off'), otherwise off. */
export function resolveShowNotes(input: { stored: string | null }): ShowNotes {
	if (input.stored === 'on' || input.stored === 'off') {
		return { enabled: input.stored === 'on', source: 'settings' };
	}
	return { enabled: false, source: 'default' };
}

/**
 * Notes reach a viewer only when enabled and the viewer could open Settings
 * (`locals.authed`: no APP_PASSWORD, or signed in). Visitors never see them.
 */
export function notesVisible(enabled: boolean, viewerIsAdmin: boolean): boolean {
	return enabled && viewerIsAdmin;
}
