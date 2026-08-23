#!/usr/bin/env node
// Writes every generated artifact. Edit plugin.config.json or the canonical shared
// reference, run this, commit both. `scripts/check.mjs` fails if they drift.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { ORIGIN_OVERRIDE_VAR, ROOT, buildArtifacts, loadConfig } from './manifests.mjs';

const config = loadConfig();
const artifacts = buildArtifacts(config);

for (const [path, contents] of artifacts) {
  const absolute = join(ROOT, path);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, contents);
  console.log(`wrote ${path}`);
}

console.log(`\n${artifacts.size} file(s) generated from plugin.config.json`);

if (process.env[ORIGIN_OVERRIDE_VAR]) {
  console.log(
    `\nLOCAL BUILD - endpoints point at ${config.server.origin}, not the recruiter host.` +
    `\nDo not commit. Run \`npm run build\` with no ${ORIGIN_OVERRIDE_VAR} to restore them;` +
    '\n`npm run check` fails until you do.',
  );
}
