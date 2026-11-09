/** Preloads and data requests need an HTTP failure, never an offline HTML shell. */
export async function networkOnlyResponse(request: Request): Promise<Response> {
	try {
		return await fetch(request);
	} catch {
		return new Response('Connection unavailable. Please try again.', {
			status: 503,
			headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' }
		});
	}
}
