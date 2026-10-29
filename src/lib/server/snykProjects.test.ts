import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { parse, stringify } from 'yaml';

const temporary: string[] = [];
const script = resolve('scripts/snyk-projects.mjs');
afterEach(() => {
	for (const directory of temporary.splice(0)) {
		if (!basename(directory).startsWith('crag-stats-snyk-')) throw new Error('Unsafe cleanup path');
		rmSync(directory, { recursive: true, force: true });
	}
});

function run(lockfile: string) {
	const root = mkdtempSync(join(tmpdir(), 'crag-stats-snyk-test-'));
	temporary.push(root);
	writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'synthetic', private: true }));
	writeFileSync(join(root, 'pnpm-lock.yaml'), lockfile);
	const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8' });
	if (result.status !== 0) return { result, projects: [] };
	const output = JSON.parse(result.stdout) as {
		outputRoot: string;
		projects: { name: string; directory: string; lockfile: string }[];
	};
	temporary.push(output.outputRoot);
	return {
		result,
		projects: output.projects.map((project) => ({
			name: project.name,
			manifest: JSON.parse(readFileSync(join(project.directory, 'package.json'), 'utf8')),
			lockfile: parse(readFileSync(project.lockfile, 'utf8'))
		}))
	};
}

const application = {
	lockfileVersion: '9.0',
	importers: { '.': { dependencies: { app: { specifier: '^1.0.0', version: '1.2.3' } } } },
	packages: { 'app@1.2.3': { resolution: { integrity: 'synthetic-app-integrity' } } },
	snapshots: { 'app@1.2.3': {} }
};

it('preserves the single application graph without inventing boot dependencies', () => {
	const { result, projects } = run(stringify(application));
	expect(result.status, result.stderr).toBe(0);
	expect(projects).toHaveLength(1);
	expect(projects[0].lockfile).toEqual(application);
});

it('preserves both graphs and promotes every boot root without overwriting the application', () => {
	const roots = {
		pnpm: { specifier: '12.15.0', version: '12.15.0' },
		config: { specifier: '^2.0.0', version: '2.1.0' }
	};
	const boot = {
		lockfileVersion: '9.0',
		importers: {
			'.': {
				packageManagerDependencies: { pnpm: roots.pnpm },
				configDependencies: { config: roots.config }
			}
		},
		packages: { 'pnpm@12.15.0': {}, 'config@2.1.0': {} },
		snapshots: { 'pnpm@12.15.0': {}, 'config@2.1.0': {} }
	};
	const { result, projects } = run(`---\r\n${stringify(boot)}---\r\n${stringify(application)}`);
	expect(result.status, result.stderr).toBe(0);
	expect(projects.map((p) => p.name)).toEqual(['application', 'boot']);
	expect(projects[0].lockfile).toEqual(application);
	expect(projects[1].lockfile.packages).toEqual(boot.packages);
	expect(projects[1].lockfile.snapshots).toEqual(boot.snapshots);
	expect(projects[1].lockfile.importers).toEqual({ '.': { dependencies: roots } });
	expect(projects[1].manifest.dependencies).toEqual({ pnpm: '12.15.0', config: '^2.0.0' });
	expect(projects[1].manifest.private).toBe(true);
});

it('refuses malformed or unsupported input instead of producing a misleading scan graph', () => {
	for (const invalid of [
		'[invalid YAML',
		'lockfileVersion: 9.0',
		`${stringify(application)}---\n{}---\n{}`
	]) {
		const { result } = run(invalid);
		expect(result.status).not.toBe(0);
		expect(result.stdout).toBe('');
	}
});

it('refuses workspace importers rather than omitting their manifests from the scan', () => {
	const { result } = run(
		stringify({ ...application, importers: { ...application.importers, 'packages/other': {} } })
	);
	expect(result.status).not.toBe(0);
	expect(result.stdout).toBe('');
});

it('refuses conflicting boot roots rather than selecting one resolution silently', () => {
	const boot = {
		...application,
		importers: {
			'.': {
				configDependencies: { pnpm: { specifier: '12.14.0', version: '12.14.0' } },
				packageManagerDependencies: { pnpm: { specifier: '12.15.0', version: '12.15.0' } }
			}
		}
	};
	const { result } = run(`---\n${stringify(boot)}---\n${stringify(application)}`);
	expect(result.status).not.toBe(0);
	expect(result.stderr).toContain('Conflicting boot dependency');
	expect(result.stdout).toBe('');
});
