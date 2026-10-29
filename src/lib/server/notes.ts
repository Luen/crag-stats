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

/** Sync modes that can carry theCrag privateMarkdown into the notes field. */
export type NotesSyncMode = 'api' | 'csv' | 'invalid';

/**
 * CSV logbook export does not include privateMarkdown. Settings disables turning the
 * notes toggle on in CSV mode so it is not mistaken for private-note access. Owners
 * can always turn it off to hide comments and previously imported private notes.
 */
export function privateNotesSyncAvailable(syncMode: NotesSyncMode): boolean {
	return syncMode !== 'csv';
}

/**
 * Notes reach a viewer only when enabled and the viewer could open Settings
 * (`locals.authed`: no APP_PASSWORD, or signed in). Visitors never see them.
 * Sync mode does not hard-hide notes — CSV Comment rows remain showable when opted in.
 */
export function notesVisible(enabled: boolean, viewerIsAdmin: boolean): boolean {
	return enabled && viewerIsAdmin;
}
