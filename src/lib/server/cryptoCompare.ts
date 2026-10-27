import { timingSafeEqual } from 'node:crypto';

/**
 * Timing-safe UTF-8 string equality.
 * Pads both sides to a common length so `timingSafeEqual` can run (it requires
 * equal-sized buffers), then requires the original lengths to match.
 * Avoids hashing — CodeQL flags SHA-256 digests used on password-like inputs.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
	const aBuf = Buffer.from(a, 'utf8');
	const bBuf = Buffer.from(b, 'utf8');
	const len = Math.max(aBuf.length, bBuf.length, 1);
	const aPad = Buffer.alloc(len);
	const bPad = Buffer.alloc(len);
	aBuf.copy(aPad);
	bBuf.copy(bPad);
	const sameBytes = timingSafeEqual(aPad, bPad);
	return sameBytes && aBuf.length === bBuf.length;
}

/** Timing-safe compare for shared worker / sync secrets. */
export function verifySharedSecret(provided: string | null, expected: string): boolean {
	if (!provided || !expected) return false;
	return timingSafeEqualString(provided, expected);
}
