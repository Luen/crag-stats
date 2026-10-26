import { createTheCragProvider } from './thecrag';
import type { ClimbProvider, ProviderId } from './types';

import { env } from '../env';

export function getProviders(): ClimbProvider[] {
	const thecragKey = env('THECRAG_API_KEY').trim() || null;
	return [createTheCragProvider(thecragKey)];
}

export function getProvider(id: ProviderId): ClimbProvider | undefined {
	return getProviders().find((p) => p.id === id);
}

export * from './types';
export * from './thecrag';
