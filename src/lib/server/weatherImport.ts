/**
 * Weather import wiring (#268): reads WEATHER_IMPORT and starts paced Open-Meteo runs
 * after each logbook sync (or from Settings). Off unless WEATHER_IMPORT=true.
 */
import { envFlag } from './env';
import { createOpenMeteoClient } from './providers/openMeteo';
import {
	DAYS_PER_RUN,
	runWeatherImportOnce,
	weatherImportStatus,
	type WeatherImportConfig,
	type WeatherImportDeps,
	type WeatherImportStatus,
	type WeatherRunResult
} from './weatherEngine';

function config(): WeatherImportConfig {
	return { enabled: envFlag('WEATHER_IMPORT') };
}

const deps: WeatherImportDeps = {
	client: createOpenMeteoClient(),
	sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
	now: () => Date.now()
};

export function isWeatherImportEnabled(): boolean {
	return config().enabled;
}

export function getWeatherImportStatus(): WeatherImportStatus {
	return weatherImportStatus(config());
}

export function runWeatherImport(): Promise<WeatherRunResult> {
	return runWeatherImportOnce(config(), deps);
}

/**
 * Start one run in the background. Safe to call often: the engine refuses while busy,
 * inside the run gap, or during back-off.
 */
export function triggerWeatherImport(reason: string): boolean {
	const c = config();
	if (!c.enabled) return false;
	void runWeatherImportOnce(c, deps)
		.then((r) => {
			if (r.outcome === 'ran' || r.outcome === 'blocked' || r.outcome === 'error') {
				console.log(`[crag-stats] weather import (${reason}): ${r.message}`);
			}
		})
		.catch((err) => {
			console.error(
				'[crag-stats] weather import failed:',
				err instanceof Error ? err.message : err
			);
		});
	return true;
}

export { DAYS_PER_RUN };
