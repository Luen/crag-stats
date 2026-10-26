import { startScheduler } from '#lib/server/scheduler';

// Start daily sync when the Node server boots (no-op in environments without API key).
startScheduler();

export function load() {
	return {};
}
