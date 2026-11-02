import { describe, expect, it, vi } from 'vitest';
import { createOpenMeteoClient, parseOpenMeteoArchive } from './openMeteo';

describe('parseOpenMeteoArchive', () => {
	it('maps daily arrays into rows', () => {
		const rows = parseOpenMeteoArchive({
			daily: {
				time: ['2024-01-15', '2024-01-16'],
				temperature_2m_max: [36.2, -1],
				temperature_2m_min: [22, -5.5],
				precipitation_sum: [0, 3.2],
				weathercode: [1, 73],
				relative_humidity_2m_mean: [40, 90],
				wind_speed_10m_max: [12, 55],
				wind_speed_10m_mean: [8, 40]
			}
		});
		expect(rows).toEqual([
			{
				day: '2024-01-15',
				tempMaxC: 36.2,
				tempMinC: 22,
				precipMm: 0,
				weatherCode: 1,
				humidityMean: 40,
				windMaxKmh: 12,
				windMeanKmh: 8
			},
			{
				day: '2024-01-16',
				tempMaxC: -1,
				tempMinC: -5.5,
				precipMm: 3.2,
				weatherCode: 73,
				humidityMean: 90,
				windMaxKmh: 55,
				windMeanKmh: 40
			}
		]);
	});

	it('accepts weather_code alias and nullish cells', () => {
		expect(
			parseOpenMeteoArchive({
				daily: {
					time: ['2023-06-01'],
					temperature_2m_max: [null],
					temperature_2m_min: [undefined],
					precipitation_sum: ['1.5'],
					weather_code: [61],
					relative_humidity_2m_mean: [NaN]
				}
			})
		).toEqual([
			{
				day: '2023-06-01',
				tempMaxC: null,
				tempMinC: null,
				precipMm: 1.5,
				weatherCode: 61,
				humidityMean: null,
				windMaxKmh: null,
				windMeanKmh: null
			}
		]);
	});

	it('returns [] for garbage', () => {
		expect(parseOpenMeteoArchive(null)).toEqual([]);
		expect(parseOpenMeteoArchive({})).toEqual([]);
		expect(parseOpenMeteoArchive({ daily: { time: ['nope'] } })).toEqual([]);
	});
});

describe('createOpenMeteoClient', () => {
	it('builds the archive URL and returns parsed days', async () => {
		const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			expect(url).toContain('latitude=-33.9');
			expect(url).toContain('longitude=151.2');
			expect(url).toContain('start_date=2024-02-01');
			expect(url).toContain('end_date=2024-02-01');
			expect(url).toContain('temperature_2m_max');
			expect(url).toContain('wind_speed_10m_max');
			return new Response(
				JSON.stringify({
					daily: {
						time: ['2024-02-01'],
						temperature_2m_max: [28],
						temperature_2m_min: [18],
						precipitation_sum: [0],
						weathercode: [0],
						relative_humidity_2m_mean: [55],
						wind_speed_10m_max: [22],
						wind_speed_10m_mean: [14]
					}
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			);
		});
		const client = createOpenMeteoClient(fetchImpl as unknown as typeof fetch);
		const result = await client.fetchDaily({
			latitude: -33.9,
			longitude: 151.2,
			startDate: '2024-02-01',
			endDate: '2024-02-01'
		});
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.days[0]?.tempMaxC).toBe(28);
		expect(fetchImpl).toHaveBeenCalledOnce();
	});

	it('surfaces HTTP errors with Retry-After', async () => {
		const fetchImpl = vi.fn(
			async () =>
				new Response('slow down', {
					status: 429,
					headers: { 'Retry-After': '120' }
				})
		);
		const client = createOpenMeteoClient(fetchImpl as unknown as typeof fetch);
		const result = await client.fetchDaily({
			latitude: 0,
			longitude: 0,
			startDate: '2020-01-01',
			endDate: '2020-01-01'
		});
		expect(result).toEqual({
			ok: false,
			status: 429,
			message:
				'Open-Meteo rate limit reached; weather import will retry later. Provider said: slow down',
			retryAfterMs: 120_000
		});
	});

	const fetchWith = (response: Response) =>
		createOpenMeteoClient((async () => response) as unknown as typeof fetch).fetchDaily({
			latitude: 0,
			longitude: 0,
			startDate: '2020-01-01',
			endDate: '2020-01-01'
		});

	it('reports a non-JSON 200 body instead of a JSON parser error', async () => {
		const result = await fetchWith(
			new Response('Unexpected error while processing request', { status: 200 })
		);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.status).toBe(502);
		expect(result.message).toBe(
			'Open-Meteo returned an unexpected (non-JSON) response. Provider said: Unexpected error while processing request'
		);
		expect(result.message).not.toMatch(/is not valid JSON/);
	});

	it('treats rate-limit text in a non-JSON body as a block', async () => {
		const result = await fetchWith(
			new Response('<html><body>Too Many Requests</body></html>', { status: 200 })
		);
		expect(result).toMatchObject({ ok: false, status: 429 });
	});

	it('uses the JSON reason from Open-Meteo error payloads', async () => {
		const result = await fetchWith(
			new Response(
				JSON.stringify({
					error: true,
					reason: 'Hourly API request limit exceeded. Please try again in the next hour.'
				}),
				{ status: 429 }
			)
		);
		expect(result).toEqual({
			ok: false,
			status: 429,
			message:
				'Open-Meteo rate limit reached; weather import will retry later. Provider said: Hourly API request limit exceeded. Please try again in the next hour.'
		});
	});

	it('treats a 200 error payload as a failure, not an empty day', async () => {
		const result = await fetchWith(
			new Response(JSON.stringify({ error: true, reason: 'Parameter mismatch' }), { status: 200 })
		);
		expect(result).toEqual({
			ok: false,
			status: 502,
			message: 'Open-Meteo HTTP 200. Provider said: Parameter mismatch'
		});
	});

	it('keeps other HTTP errors and trims long bodies to one line', async () => {
		const result = await fetchWith(
			new Response(
				`bad
${'x'.repeat(500)}`,
				{ status: 500 }
			)
		);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.status).toBe(500);
		expect(result.message.startsWith('Open-Meteo HTTP 500. Provider said: bad x')).toBe(true);
		expect(result.message.length).toBeLessThan(220);
	});
});
