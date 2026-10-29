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

export type TheCragSyncMode = 'api' | 'csv' | 'invalid';

/** CSV logbook export does not include private ascent comments. */
export function privateNotesSyncAvailable(syncMode: TheCragSyncMode): boolean {
	return syncMode !== 'csv';
}

/**
 * Notes reach a viewer only when enabled and the viewer could open Settings
 * (`locals.authed`: no APP_PASSWORD, or signed in). Visitors never see them.
 * CSV-only sync never exposes notes (export has no private comments).
 */
export function notesVisible(
	enabled: boolean,
	viewerIsAdmin: boolean,
	syncMode: TheCragSyncMode = 'api'
): boolean {
	if (!privateNotesSyncAvailable(syncMode)) return false;
	return enabled && viewerIsAdmin;
}
