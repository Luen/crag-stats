/**
 * Open-Meteo Historical Weather API client (#268).
 * Free non-commercial tier for self-hosted installs. Injectable fetch for tests.
 *
 * Docs: https://open-meteo.com/en/docs/historical-weather-api
 */

export type OpenMeteoDaily = {
	day: string;
	tempMaxC: number | null;
	tempMinC: number | null;
	precipMm: number | null;
	weatherCode: number | null;
	humidityMean: number | null;
	/** km/h (Open-Meteo default for wind_speed_10m_*). */
	windMaxKmh: number | null;
	windMeanKmh: number | null;
};

export type OpenMeteoFetchResult =
	| { ok: true; days: OpenMeteoDaily[] }
	| { ok: false; status: number; message: string; retryAfterMs?: number };

export type OpenMeteoClient = {
	fetchDaily(opts: {
		latitude: number;
		longitude: number;
		startDate: string;
		endDate: string;
	}): Promise<OpenMeteoFetchResult>;
};

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const DAILY_VARS =
	'temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,relative_humidity_2m_mean,wind_speed_10m_max,wind_speed_10m_mean';

function numOrNull(v: unknown): number | null {
	if (v == null) return null;
	const n = typeof v === 'number' ? v : Number(v);
	return Number.isFinite(n) ? n : null;
}

function parseRetryAfterMs(header: string | null): number | undefined {
	if (!header) return undefined;
	const asInt = Number(header);
	if (Number.isFinite(asInt) && asInt >= 0) return Math.round(asInt * 1000);
	const when = Date.parse(header);
	if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
	return undefined;
}

/** Open-Meteo signals usage limits in the body (`reason`), sometimes without a 429. */
const RATE_LIMIT_TEXT = /\b(rate|request|api|usage)[\s-]*limit|too many requests|limit exceeded/i;

type JsonBody = { ok: true; value: unknown } | { ok: false };

function parseJsonBody(text: string): JsonBody {
	if (!text.trim()) return { ok: false };
	try {
		return { ok: true, value: JSON.parse(text) };
	} catch {
		return { ok: false };
	}
}

function isErrorPayload(value: unknown): boolean {
	return !!value && typeof value === 'object' && (value as { error?: unknown }).error === true;
}

/** One short line of provider text; never the raw parser error. */
function snippet(text: string): string {
	return text
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 160);
}

function describeFailure(
	httpStatus: number,
	httpOk: boolean,
	text: string,
	body: JsonBody,
	retryAfterMs: number | undefined
): OpenMeteoFetchResult {
	const reason =
		body.ok && body.value && typeof body.value === 'object'
			? (body.value as { reason?: unknown }).reason
			: undefined;
	const detail = typeof reason === 'string' && reason.trim() ? snippet(reason) : snippet(text);
	const rateLimited = httpStatus === 429 || RATE_LIMIT_TEXT.test(detail);
	// A 2xx with a non-JSON or error body is still a failed request: report it as a
	// gateway problem (or a rate limit) so the import backs off instead of caching it.
	const status = rateLimited ? 429 : httpOk ? 502 : httpStatus;
	let message: string;
	if (rateLimited) {
		message = 'Open-Meteo rate limit reached; weather import will retry later.';
	} else if (!body.ok && httpOk) {
		message = 'Open-Meteo returned an unexpected (non-JSON) response.';
	} else {
		message = `Open-Meteo HTTP ${httpStatus}.`;
	}
	if (detail) message += ` Provider said: ${detail}`;
	return { ok: false, status, message, ...(retryAfterMs != null ? { retryAfterMs } : {}) };
}

/** Parse the Open-Meteo archive JSON body into daily rows. */
export function parseOpenMeteoArchive(body: unknown): OpenMeteoDaily[] {
	if (!body || typeof body !== 'object') return [];
	const daily = (body as { daily?: unknown }).daily;
	if (!daily || typeof daily !== 'object') return [];
	const d = daily as Record<string, unknown>;
	const times = Array.isArray(d.time) ? d.time : [];
	const tmax = Array.isArray(d.temperature_2m_max) ? d.temperature_2m_max : [];
	const tmin = Array.isArray(d.temperature_2m_min) ? d.temperature_2m_min : [];
	const precip = Array.isArray(d.precipitation_sum) ? d.precipitation_sum : [];
	const codes = Array.isArray(d.weathercode)
		? d.weathercode
		: Array.isArray(d.weather_code)
			? d.weather_code
			: [];
	const humidity = Array.isArray(d.relative_humidity_2m_mean) ? d.relative_humidity_2m_mean : [];
	const windMax = Array.isArray(d.wind_speed_10m_max) ? d.wind_speed_10m_max : [];
	const windMean = Array.isArray(d.wind_speed_10m_mean) ? d.wind_speed_10m_mean : [];

	const out: OpenMeteoDaily[] = [];
	for (let i = 0; i < times.length; i++) {
		const day = String(times[i] ?? '').slice(0, 10);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
		out.push({
			day,
			tempMaxC: numOrNull(tmax[i]),
			tempMinC: numOrNull(tmin[i]),
			precipMm: numOrNull(precip[i]),
			weatherCode: numOrNull(codes[i]),
			humidityMean: numOrNull(humidity[i]),
			windMaxKmh: numOrNull(windMax[i]),
			windMeanKmh: numOrNull(windMean[i])
		});
	}
	return out;
}

export function createOpenMeteoClient(
	fetchImpl: typeof fetch = fetch,
	baseUrl = ARCHIVE_URL
): OpenMeteoClient {
	return {
		async fetchDaily({ latitude, longitude, startDate, endDate }) {
			const url = new URL(baseUrl);
			url.searchParams.set('latitude', String(latitude));
			url.searchParams.set('longitude', String(longitude));
			url.searchParams.set('start_date', startDate);
			url.searchParams.set('end_date', endDate);
			url.searchParams.set('daily', DAILY_VARS);
			url.searchParams.set('timezone', 'auto');

			let res: Response;
			try {
				res = await fetchImpl(url.toString(), {
					headers: { Accept: 'application/json' }
				});
			} catch (err) {
				return {
					ok: false,
					status: 0,
					message: err instanceof Error ? err.message : String(err)
				};
			}

			const retryAfterMs = parseRetryAfterMs(res.headers.get('retry-after'));
			let text = '';
			try {
				text = await res.text();
			} catch {
				/* ignore */
			}
			const body = parseJsonBody(text);

			if (!res.ok || !body.ok || isErrorPayload(body.value)) {
				return describeFailure(res.status, res.ok, text, body, retryAfterMs);
			}

			return { ok: true, days: parseOpenMeteoArchive(body.value) };
		}
	};
}
