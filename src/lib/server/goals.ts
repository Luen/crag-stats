import { desc, eq } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { ascents, goals, type Goal } from './db/schema';

export type GoalKind = 'grade' | 'height_year' | 'days_month' | 'custom';

function nowIso() {
	return new Date().toISOString();
}

function validDay(iso: string | null | undefined): string | null {
	const d = (iso || '').slice(0, 10);
	const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return null;
	const year = Number(m[1]);
	const month = Number(m[2]);
	const day = Number(m[3]);
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	const dt = new Date(`${d}T12:00:00`);
	if (Number.isNaN(dt.getTime())) return null;
	if (dt.getFullYear() !== year || dt.getMonth() + 1 !== month || dt.getDate() !== day) return null;
	return d;
}

export function listGoals(): Goal[] {
	ensureSchema();
	updateGoalProgress();
	return db.select().from(goals).orderBy(desc(goals.createdAt)).all();
}

export function createGoal(input: {
	kind: GoalKind | string;
	title: string;
	targetValue?: string | null;
	targetGradeScore?: number | null;
	year?: number | null;
}): Goal {
	ensureSchema();
	const updatedAt = nowIso();
	const kind = String(input.kind || 'custom').trim() || 'custom';
	const title = String(input.title || '').trim() || 'Untitled goal';
	const year =
		input.year != null && Number.isFinite(input.year)
			? Math.trunc(input.year)
			: kind === 'height_year'
				? new Date().getFullYear()
				: null;

	const inserted = db
		.insert(goals)
		.values({
			kind,
			title,
			targetValue: input.targetValue?.trim() || null,
			targetGradeScore:
				input.targetGradeScore != null && Number.isFinite(input.targetGradeScore)
					? input.targetGradeScore
					: null,
			year,
			progressValue: null,
			completed: false,
			createdAt: updatedAt,
			updatedAt
		})
		.returning()
		.get();

	updateGoalProgress();
	return db.select().from(goals).where(eq(goals.id, inserted.id)).get()!;
}

export function deleteGoal(id: number) {
	ensureSchema();
	db.delete(goals).where(eq(goals.id, id)).run();
}

export function setGoalCompleted(id: number, completed: boolean) {
	ensureSchema();
	db.update(goals)
		.set({ completed, updatedAt: nowIso() })
		.where(eq(goals.id, id))
		.run();
}

/**
 * Recompute auto progress for height_year / days_month / grade goals from ascents.
 * Custom goals keep manual progress_value / completed.
 */
export function updateGoalProgress(): void {
	ensureSchema();
	const rows = db.select().from(goals).all();
	if (rows.length === 0) return;

	const ascentRows = db
		.select({
			ascentDate: ascents.ascentDate,
			heightM: ascents.heightM,
			isSend: ascents.isSend,
			effectiveGradeScore: ascents.effectiveGradeScore
		})
		.from(ascents)
		.all();

	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

	const heightByYear = new Map<number, number>();
	const daysThisMonth = new Set<string>();
	let hardestSendScore: number | null = null;

	for (const a of ascentRows) {
		const day = validDay(a.ascentDate);
		if (!day) continue;
		const y = Number(day.slice(0, 4));
		if (a.heightM != null && Number.isFinite(a.heightM)) {
			heightByYear.set(y, (heightByYear.get(y) ?? 0) + a.heightM);
		}
		if (day.startsWith(currentMonth)) daysThisMonth.add(day);
		if (a.isSend && a.effectiveGradeScore != null && Number.isFinite(a.effectiveGradeScore)) {
			hardestSendScore =
				hardestSendScore == null
					? a.effectiveGradeScore
					: Math.max(hardestSendScore, a.effectiveGradeScore);
		}
	}

	const updatedAt = nowIso();
	for (const g of rows) {
		if (g.kind === 'custom') continue;

		let progressValue: string | null = g.progressValue;
		let completed = g.completed;

		if (g.kind === 'height_year') {
			const y = g.year ?? currentYear;
			const metres = Math.round(heightByYear.get(y) ?? 0);
			progressValue = String(metres);
			const target = Number(g.targetValue);
			if (Number.isFinite(target) && target > 0) {
				completed = metres >= target;
			}
		} else if (g.kind === 'days_month') {
			const days = daysThisMonth.size;
			progressValue = String(days);
			const target = Number(g.targetValue);
			if (Number.isFinite(target) && target > 0) {
				completed = days >= target;
			}
		} else if (g.kind === 'grade') {
			const score = g.targetGradeScore;
			if (score != null && Number.isFinite(score)) {
				progressValue =
					hardestSendScore != null ? String(Math.round(hardestSendScore * 10) / 10) : '0';
				completed = hardestSendScore != null && hardestSendScore >= score;
			}
		}

		if (progressValue === g.progressValue && completed === g.completed) continue;
		db.update(goals)
			.set({ progressValue, completed, updatedAt })
			.where(eq(goals.id, g.id))
			.run();
	}
}
