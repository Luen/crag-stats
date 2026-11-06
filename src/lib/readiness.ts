/** Practice credit is evidence of sessions, never a send probability. */
export function sessionReadiness(base: number, qualifyingSessions: number) {
	const sessions = Number.isFinite(qualifyingSessions)
		? Math.max(0, Math.floor(qualifyingSessions))
		: 0;
	const bonus = Math.max(0, sessions - 1);
	return Math.min(99, Math.round((Math.min(94, Math.max(0, base)) + bonus) * 10) / 10);
}
