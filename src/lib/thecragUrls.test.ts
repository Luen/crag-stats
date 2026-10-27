import { describe, expect, it } from 'vitest';
import {
	joinAncestorStub,
	theCragAreaUrl,
	theCragAscentUrl,
	theCragBestLink,
	theCragRouteUrl
} from './thecragUrls';

describe('theCrag URL helpers', () => {
	it('does not glue stub without slash (australia… bug)', () => {
		expect(joinAncestorStub('australia/townsville')).toBe('australia/townsville');
		expect(joinAncestorStub('/australia/townsville/')).toBe('australia/townsville');
		expect(theCragRouteUrl(123, 'australia/townsville')).toBe(
			'https://www.thecrag.com/en/climbing/australia/townsville/route/123'
		);
		expect(theCragAreaUrl(11818021, 'australia/townsville')).toBe(
			'https://www.thecrag.com/en/climbing/australia/townsville/area/11818021'
		);
	});

	it('builds ascent URLs', () => {
		expect(theCragAscentUrl(2039606838)).toBe('https://www.thecrag.com/ascent/2039606838');
	});

	it('prefers ascent link over route', () => {
		expect(
			theCragBestLink({
				ascentId: 1,
				routeId: 2,
				ancestorStub: 'australia/x'
			})
		).toBe('https://www.thecrag.com/ascent/1');
	});
});
