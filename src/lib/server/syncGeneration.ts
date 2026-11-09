let generation = 0;

/** Capture before starting work; Wipe invalidates pending responses. */
export function syncIsCurrent(): () => boolean {
	const current = generation;
	return () => current === generation;
}

export function invalidateLogbookSync() {
	generation += 1;
}
