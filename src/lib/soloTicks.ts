/** Documented theCrag solo tick IDs/labels, also accepting separator/case variants. */
export function soloTickKind(raw: string | null | undefined): 'lead' | 'toprope' | 'aid' | null {
	const key = (raw ?? '')
		.trim()
		.toLowerCase()
		.replace(/[\s_-]+/g, '');
	if (key === 'leadsolo') return 'lead';
	if (key === 'ropedsolo' || key === 'topropesolo') return 'toprope';
	if (key === 'aidsolo') return 'aid';
	return null;
}
