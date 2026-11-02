import { OFFLINE_SYNC_TAG, type OfflineSnapshot } from './offline';

type OfflineResult = {
	snapshot?: OfflineSnapshot | null;
	error?: string;
	cleared?: boolean;
	automatic?: boolean;
};

export function offlineCommand(
	type: 'READ' | 'SAVE' | 'CLEAR' | 'AUTO_REFRESH'
): Promise<OfflineResult> {
	const controller = navigator.serviceWorker.controller;
	if (!controller)
		return Promise.reject(
			new Error('Offline mode is still preparing. Reload this page while connected.')
		);
	return new Promise((resolve, reject) => {
		const channel = new MessageChannel();
		const timeout = setTimeout(() => {
			channel.port1.close();
			reject(new Error('The server or offline storage did not respond. Try again.'));
		}, 20000);
		channel.port1.onmessage = (event) => {
			clearTimeout(timeout);
			channel.port1.close();
			resolve(event.data);
		};
		controller.postMessage({ type }, [channel.port2]);
	});
}

/** Installation is the opt-in; ordinary browser visits never start a download. */
export function startOfflineRefresh(): () => void {
	if (!('serviceWorker' in navigator) || !window.isSecureContext) return () => {};
	const standalone = matchMedia('(display-mode: standalone)');
	let installed =
		standalone.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
	let busy = false;
	let stopped = false;
	const refresh = async () => {
		if (!installed || stopped || busy || !navigator.onLine || document.visibilityState === 'hidden')
			return;
		busy = true;
		try {
			const registration = await navigator.serviceWorker.ready;
			if (stopped || !navigator.serviceWorker.controller) return;
			const result = await offlineCommand('AUTO_REFRESH');
			if (stopped || !result.automatic || result.error) return;
			const periodic = (
				registration as ServiceWorkerRegistration & {
					periodicSync?: {
						getTags(): Promise<string[]>;
						register(tag: string, options: { minInterval: number }): Promise<void>;
					};
				}
			).periodicSync;
			if (periodic && !(await periodic.getTags()).includes(OFFLINE_SYNC_TAG))
				await periodic.register(OFFLINE_SYNC_TAG, { minInterval: 24 * 60 * 60 * 1000 });
		} catch {
			// Connectivity, storage and background-sync permission are best-effort.
		} finally {
			busy = false;
		}
	};
	const installedNow = () => {
		installed = true;
		void refresh();
	};
	const check = () => void refresh();
	window.addEventListener('appinstalled', installedNow);
	standalone.addEventListener('change', checkMode);
	function checkMode() {
		if (standalone.matches) installedNow();
	}
	window.addEventListener('online', check);
	document.addEventListener('visibilitychange', check);
	navigator.serviceWorker.addEventListener('controllerchange', check);
	const interval = setInterval(check, 60000);
	check();
	return () => {
		stopped = true;
		clearInterval(interval);
		window.removeEventListener('appinstalled', installedNow);
		standalone.removeEventListener('change', checkMode);
		window.removeEventListener('online', check);
		document.removeEventListener('visibilitychange', check);
		navigator.serviceWorker.removeEventListener('controllerchange', check);
	};
}
