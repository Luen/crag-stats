import Database from 'better-sqlite3';

const db = new Database('./data/crag-stats.sqlite');
const routes = db
	.prepare(
		`select count(*) c, round(sum(height_m),1) h, sum(case when height_m is null then 1 else 0 end) missing from routes`
	)
	.get();
const ascents = db.prepare(`select count(*) c, round(sum(height_m),1) h from ascents`).get();
console.log(JSON.stringify({ routes, ascents }, null, 2));
