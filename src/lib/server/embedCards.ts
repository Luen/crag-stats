/**
 * Embeddable SVG stat cards (Dreeve-style badges): `/embed/<card>.svg`, used from a
 * plain `<img>` on blogs and forum profiles. Only aggregates and route names the
 * dashboard already shows publicly. Never ascent notes, partners or tags.
 *
 * Fonts: an SVG in `<img>` can't load web fonts, so this uses a system stack.
 */
import { bandById } from '#lib/grades';
import { STYLE_COLORS } from '#lib/ticks';
import type { DashboardStats } from '#lib/types/dashboard';

export const EMBED_CARDS = ['summary', 'eddington', 'hardest'] as const;
export type EmbedCard = (typeof EMBED_CARDS)[number];
export type EmbedTheme = 'light' | 'dark';

export function isEmbedCard(v: string): v is EmbedCard {
	return (EMBED_CARDS as readonly string[]).includes(v);
}

export function parseEmbedTheme(v: string | null): EmbedTheme {
	return v === 'dark' ? 'dark' : 'light';
}

/** Same values as the light/dark tokens in src/app.css. */
const THEMES: Record<EmbedTheme, Record<string, string>> = {
	light: {
		bg: '#ffffff',
		ink: '#161a23',
		muted: '#576071',
		line: '#e6e8ec',
		tile: '#f8f9fb',
		accent: '#c2410c',
		brand: '#ea580c'
	},
	dark: {
		bg: '#171b23',
		ink: '#e8eaf0',
		muted: '#98a1b3',
		line: '#2a303c',
		tile: '#1d222c',
		accent: '#fb7a3c',
		brand: '#fb7a3c'
	}
};

const FONT = "'Plus Jakarta Sans','Segoe UI',system-ui,-apple-system,Helvetica,Arial,sans-serif";
const W = 480;

export function escapeXml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function clip(s: string, max: number): string {
	return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function fmt(n: number): string {
	return Math.round(n).toLocaleString('en-US');
}

function logo(x: number, y: number, size: number, color: string): string {
	const s = size / 64;
	return `<g transform="translate(${x} ${y}) scale(${s})">
	<mask id="cs-bars"><rect width="64" height="64" fill="#fff"/><g fill="#000"><rect x="18" y="43" width="6" height="18" rx="1"/><rect x="29" y="35" width="6" height="26" rx="1"/><rect x="40" y="27" width="6" height="34" rx="1"/></g></mask>
	<path d="M2 56 L22 18 L30.5 32 L41.5 10 L62 56 Z" fill="${color}" mask="url(#cs-bars)"/>
</g>`;
}

function frame(t: Record<string, string>, height: number, title: string, body: string): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" role="img" aria-label="${escapeXml(title)}">
<title>${escapeXml(title)}</title>
<style>text{font-family:${FONT}}</style>
<rect x="0.5" y="0.5" width="${W - 1}" height="${height - 1}" rx="14" fill="${t.bg}" stroke="${t.line}"/>
${body}
</svg>`;
}

function header(t: Record<string, string>, name: string, sub: string): string {
	return `${logo(20, 16, 34, t.brand)}
<text x="62" y="32" font-size="16" font-weight="700" fill="${t.ink}">${escapeXml(clip(name, 34))}</text>
<text x="62" y="49" font-size="12" fill="${t.muted}">${escapeXml(sub)}</text>
<text x="${W - 20}" y="32" font-size="12" font-weight="700" text-anchor="end"><tspan fill="${t.ink}">Crag </tspan><tspan fill="${t.brand}">Stats</tspan></text>`;
}

function tiles(
	t: Record<string, string>,
	y: number,
	items: { value: string; label: string }[]
): string {
	const gap = 8;
	const w = (W - 40 - gap * (items.length - 1)) / items.length;
	return items
		.map((it, i) => {
			const x = 20 + i * (w + gap);
			return `<rect x="${x}" y="${y}" width="${w}" height="62" rx="9" fill="${t.tile}" stroke="${t.line}"/>
<rect x="${x}" y="${y}" width="${w}" height="3" rx="1.5" fill="${t.accent}"/>
<text x="${x + w / 2}" y="${y + 33}" font-size="21" font-weight="800" text-anchor="middle" fill="${t.ink}">${escapeXml(it.value)}</text>
<text x="${x + w / 2}" y="${y + 51}" font-size="11" text-anchor="middle" fill="${t.muted}">${escapeXml(it.label)}</text>`;
		})
		.join('\n');
}

/** Band 2 (Intermediate) is yellow and needs dark text. */
function chip(x: number, y: number, label: string, color: string, band: number | null): string {
	const w = Math.max(34, label.length * 7.4 + 14);
	const fg = band === 2 ? '#161a23' : '#ffffff';
	return `<rect x="${x}" y="${y}" width="${w}" height="20" rx="10" fill="${color}"/>
<text x="${x + w / 2}" y="${y + 14}" font-size="11.5" font-weight="700" text-anchor="middle" fill="${fg}">${escapeXml(label)}</text>`;
}

function displayName(s: DashboardStats): string {
	return s.profileName ? `${s.profileName}` : 'My climbing';
}

/** Accessible title: "Alex's climbing stats", or "Climbing stats" without a profile. */
function cardTitle(s: DashboardStats, what: string): string {
	return s.profileName ? `${s.profileName}'s ${what}` : what[0].toUpperCase() + what.slice(1);
}

function summaryCard(s: DashboardStats, t: Record<string, string>): string {
	const sub = `${s.climberType}${s.blurb.durationLabel ? ` · climbing ${s.blurb.durationLabel}` : ''}`;
	const metrics = tiles(t, 68, [
		{ value: fmt(s.totalAscents), label: 'ascents' },
		{ value: fmt(s.totalSends), label: 'sends' },
		{ value: fmt(s.onsightCount), label: 'onsights' },
		{ value: `${s.heightKm.toLocaleString('en-US')} km`, label: 'climbed' }
	]);

	// Hardest send per discipline, from the sends pyramid (rows ascend by score).
	const hardest = (s.stylePyramidsByMode?.sends ?? [])
		.filter((p) => p.rows.length)
		.sort((a, b) => b.total - a.total)
		.slice(0, 3)
		.map((p) => ({ style: p.style, row: p.rows[p.rows.length - 1] }));

	let x = 20;
	const parts: string[] = [];
	for (const h of hardest) {
		const color = STYLE_COLORS[h.style] ?? STYLE_COLORS.Unknown;
		parts.push(
			`<circle cx="${x + 5}" cy="${157}" r="5" fill="${color}"/>`,
			`<text x="${x + 15}" y="${161}" font-size="12" fill="${t.ink}">${escapeXml(h.style)}</text>`
		);
		const textW = h.style.length * 7 + 22;
		parts.push(chip(x + textW, 147, h.row.grade, h.row.color, h.row.band));
		x += textW + Math.max(34, h.row.grade.length * 7.4 + 14) + 18;
	}

	// Style share bar.
	let bx = 20;
	const barW = W - 40;
	const bar = s.styleShare
		.filter((p) => p.pct > 0)
		.map((p) => {
			const w = (p.pct / 100) * barW;
			const r = `<rect x="${bx}" y="186" width="${Math.max(w, 0)}" height="8" fill="${p.color}"/>`;
			bx += w;
			return r;
		})
		.join('');

	const body = `${header(t, displayName(s), sub)}
${metrics}
<text x="20" y="${140}" font-size="11" font-weight="700" fill="${t.muted}" letter-spacing="0.5">HARDEST SENDS</text>
${parts.join('\n')}
<clipPath id="bar"><rect x="20" y="186" width="${barW}" height="8" rx="4"/></clipPath>
<rect x="20" y="186" width="${barW}" height="8" rx="4" fill="${t.line}"/>
<g clip-path="url(#bar)">${bar}</g>
<text x="20" y="214" font-size="11" fill="${t.muted}">${escapeXml(
		s.styleShare
			.slice(0, 4)
			.map((p) => `${p.style} ${Math.round(p.pct)}%`)
			.join(' · ')
	)}</text>`;
	return frame(t, 228, cardTitle(s, 'climbing stats'), body);
}

function eddingtonCard(s: DashboardStats, t: Record<string, string>): string {
	const e = s.eddington;
	const body = `${header(t, displayName(s), 'Eddington numbers · the biggest E you’ve hit E times')}
${tiles(t, 68, [
	{ value: String(e.sends.value), label: 'send days' },
	{ value: String(e.vertical.value), label: `vertical (${e.verticalUnitM} m)` },
	{ value: String(e.routeGrade.value), label: 'route grade' },
	{ value: String(e.boulderGrade.value), label: 'boulder grade' }
])}
<text x="20" y="152" font-size="11.5" fill="${t.muted}">${escapeXml(
		`${e.sends.value} days with ${e.sends.value}+ sends · ${e.vertical.value} days of ${e.vertical.value * e.verticalUnitM}+ m`
	)}</text>
<text x="20" y="170" font-size="11.5" fill="${t.muted}">${escapeXml(
		`${e.routeGrade.value} routes at Ewbank ${e.routeGrade.value}+ · ${e.boulderGrade.value} problems at V${e.boulderGrade.value}+`
	)}</text>`;
	return frame(t, 188, cardTitle(s, 'Eddington numbers'), body);
}

function hardestCard(s: DashboardStats, t: Record<string, string>): string {
	const rows = s.hardestSends.slice(0, 5);
	const list = rows.length
		? rows
				.map((r, i) => {
					const y = 82 + i * 28;
					const grade = r.gradeLabel ?? r.gradeRaw ?? '?';
					const meta = [r.cragName, r.ascentDate?.slice(0, 4)].filter(Boolean).join(' · ');
					return `${chip(20, y - 14, grade, bandColor(r.gradeBand), r.gradeBand)}
<text x="80" y="${y}" font-size="13" font-weight="600" fill="${t.ink}">${escapeXml(clip(r.routeName, 30))}</text>
<text x="${W - 20}" y="${y}" font-size="11" text-anchor="end" fill="${t.muted}">${escapeXml(clip(meta, 26))}</text>`;
				})
				.join('\n')
		: `<text x="20" y="90" font-size="13" fill="${t.muted}">No graded sends yet.</text>`;
	const height = 82 + Math.max(rows.length, 1) * 28;
	return frame(
		t,
		height,
		cardTitle(s, 'hardest sends'),
		`${header(t, displayName(s), 'Hardest sends')}\n${list}`
	);
}

function bandColor(band: number | null): string {
	return bandById(band)?.color ?? '#888888';
}

export function renderEmbedCard(card: EmbedCard, stats: DashboardStats, theme: EmbedTheme): string {
	const t = THEMES[theme];
	if (card === 'eddington') return eddingtonCard(stats, t);
	if (card === 'hardest') return hardestCard(stats, t);
	return summaryCard(stats, t);
}
