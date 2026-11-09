/**
 * Ascent notes: theCrag's public `markdown` and private `privateMarkdown` comments, joined
 * into ascents.comment. The private half comes only with a supporter API key, so the whole
 * field is treated as private. Hidden by default; the owner opts in in Settings.
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
