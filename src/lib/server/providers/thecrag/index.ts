import type { ClimbProvider, SyncCursor } from '../types';
import { fetchTheCragPage } from './api';
import { parseTheCragCsv } from './csv';

export function createTheCragProvider(apiKey?: string | null): ClimbProvider {
	return {
		id: 'thecrag',
		label: 'theCrag',
		capabilities: {
			apiSync: Boolean(apiKey),
			csvImport: true,
			incremental: true
		},
		async syncAscents(cursor: SyncCursor) {
			if (!apiKey) throw new Error('THECRAG_API_KEY is not configured');
			return fetchTheCragPage(apiKey, cursor);
		},
		async parseExport(file, format) {
			if (format !== 'csv') throw new Error('Only CSV import is supported for theCrag in v1');
			return parseTheCragCsv(file);
		}
	};
}

export { fetchTheCragPage, syncTheCragAll } from './api';
export { parseTheCragCsv } from './csv';
