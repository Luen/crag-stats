#!/usr/bin/env node
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import yaml from 'yaml';
const { parseAllDocuments, stringify } = yaml;

// Snyk currently accepts one pnpm YAML document per project. Keep both graphs
// separate: their shared importer key would overwrite dependencies if merged.
// Scan the caller's working directory; do not accept a second arbitrary-path input.
const root = process.cwd();
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const documents = parseAllDocuments(readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8'));
if (documents.length < 1 || documents.length > 2 || documents.some((d) => d.errors.length)) {
	throw new Error('Expected one or two valid pnpm lockfile documents.');
}
const graphs = documents.map((d) => d.toJS());
if (
	graphs.some(
		(g) =>
			g?.lockfileVersion !== '9.0' ||
			!g.importers?.['.'] ||
			Object.keys(g.importers).length !== 1 ||
			!g.packages ||
			!g.snapshots
	)
) {
	throw new Error('Unsupported lockfile graph; refusing an incomplete scan projection.');
}
const projects = [{ name: 'application', manifest, lockfile: graphs.at(-1) }];
if (graphs.length === 2) {
	const boot = graphs[0];
	const importer = boot.importers['.'];
	if (
		Object.keys(importer).some(
			(key) => key !== 'configDependencies' && key !== 'packageManagerDependencies'
		)
	) {
		throw new Error('Unsupported boot importer fields.');
	}
	const dependencies = {};
	for (const group of [importer.configDependencies, importer.packageManagerDependencies]) {
		for (const [name, dependency] of Object.entries(group || {})) {
			if (!dependency || typeof dependency.specifier !== 'string' || !dependency.version) {
				throw new Error(`Unsupported boot dependency: ${name}`);
			}
			if (dependencies[name] && stringify(dependencies[name]) !== stringify(dependency)) {
				throw new Error(`Conflicting boot dependency: ${name}`);
			}
			dependencies[name] = dependency;
		}
	}
	if (!Object.keys(dependencies).length) throw new Error('Boot graph has no dependency roots.');
	boot.importers = { '.': { dependencies } };
	projects.push({
		name: 'boot',
		manifest: {
			name: `${manifest.name}-pnpm-boot-scan`,
			version: manifest.version,
			private: manifest.private,
			dependencies: Object.fromEntries(
				Object.entries(dependencies).map(([name, dependency]) => [name, dependency.specifier])
			)
		},
		lockfile: boot
	});
}

// Never modify the repository manifests or re-resolve any version.
const outputRoot = mkdtempSync(join(tmpdir(), 'crag-stats-snyk-'));
const output = projects.map((project) => {
	const directory = join(outputRoot, project.name);
	mkdirSync(directory);
	writeFileSync(join(directory, 'package.json'), JSON.stringify(project.manifest, null, 2) + '\n');
	const lockfile = join(directory, 'pnpm-lock.yaml');
	writeFileSync(lockfile, stringify(project.lockfile));
	return { name: project.name, directory, lockfile };
});
console.log(JSON.stringify({ outputRoot, projects: output }));
