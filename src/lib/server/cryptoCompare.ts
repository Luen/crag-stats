import { createHash, timingSafeEqual } from 'node:crypto';

/** Timing-safe equality of two UTF-8 strings via SHA-256 digests (length-independent). */
export function timingSafeEqualString(a: string, b: string): boolean {
	const da = createHash('sha256').update(a, 'utf8').digest();
	const db = createHash('sha256').update(b, 'utf8').digest();
	return timingSafeEqual(da, db);
}

/** Timing-safe compare for shared worker / sync secrets. */
export function verifySharedSecret(provided: string | null, expected: string): boolean {
	if (!provided || !expected) return false;
	return timingSafeEqualString(provided, expected);
}
