#!/usr/bin/env node
/**
 * Production entry: `node scripts/server.mjs` (wraps `build/index.js`).
 *
 * @sveltejs/adapter-node builds each request's origin from headers and assumes **https**
 * when no protocol header is present (it ignores `ORIGIN` in this version). Opened directly
 * over plain HTTP (e.g. http://localhost:8097 on a LAN), SvelteKit's CSRF check then sees
 * `Origin: http://…` vs `https://…` and rejects every form POST (#47).
 *
 * Fix, before the adapter handles each request:
 * - `ORIGIN` set (e.g. https://crag.example.com): trust it. Protocol and host come from it.
 *   Use this behind a proxy that does not send X-Forwarded-Proto.
 * - Otherwise: keep a proxy's X-Forwarded-Proto (Cloudflare Tunnel, nginx, Caddy…) and fill
 *   it in from the actual connection when absent: this server speaks plain HTTP, so `http`.
 *
 * CSRF protection is unchanged: the check compares the browser-set `Origin` header with the
 * request URL, and a cross-site form can set neither header.
 */
import { resolveForwarding } from './serverOrigin.mjs';

const forwarding = resolveForwarding(process.env);
// The adapter reads PROTOCOL_HEADER / HOST_HEADER at import time.
process.env.PROTOCOL_HEADER = forwarding.protocolHeader;
if (forwarding.hostHeader) process.env.HOST_HEADER = forwarding.hostHeader;

const { server } = await import('../build/index.js');

server.prependListener('request', (req) => {
	forwarding.apply(req.headers, Boolean(req.socket?.encrypted));
});
