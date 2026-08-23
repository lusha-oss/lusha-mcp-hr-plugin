#!/usr/bin/env node
// CI gate. Four checks, in order of how badly the thing they catch would read to a
// recruiter:
//
//   1. every skill has usable frontmatter, and its name matches its folder
//   2. no sales vocabulary in anything a recruiter reads
//   3. the mirrored shared references are byte-identical to the canonical one
//   4. the generated manifests match plugin.config.json
//
// Check 2 is the plugin-side twin of an equivalent server-side guard over tool and
// parameter descriptions. This one covers the skill text, which is the other half of what
// the model reads and the half a human edits by hand.
//
// This does not check that a skill only names tools the recruiter surface actually serves.
// That crosswalk is server-owned and changes on the server's schedule, so mirroring it here
// would just be a second copy to keep in sync; the server's own tests are the source of
// truth for which tool names exist.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { ORIGIN_OVERRIDE_VAR, ROOT, SKILLS, buildArtifacts, readJson } from './manifests.mjs';

const issues = [];
const fail = (where, message) => issues.push(`${where}: ${message}`);

const config = readJson('plugin.config.json');

const CANONICAL_REFERENCE = 'skills/_shared/SHARED-REFERENCE.md';

// ---------------------------------------------------------------------------
// 1. Frontmatter
// ---------------------------------------------------------------------------

const skillText = new Map();

for (const skill of SKILLS) {
  const path = `skills/${skill}/SKILL.md`;
  if (!existsSync(join(ROOT, path))) {
    fail(path, 'missing');
    continue;
  }

  const raw = readFileSync(join(ROOT, path), 'utf8');
  skillText.set(path, raw);

  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  if (!frontmatter) {
    fail(path, 'no parseable frontmatter block');
    continue;
  }

  const field = (key) => new RegExp(`^${key}:\\s*(.+)$`, 'm').exec(frontmatter[1])?.[1]?.trim();
  const name = field('name');
  const description = field('description');

  if (!name) fail(path, 'frontmatter has no name');
  else if (name !== skill) fail(path, `frontmatter name '${name}' does not match folder '${skill}'`);

  if (!description) fail(path, 'frontmatter has no description');
  // The description is the only thing deciding whether the skill fires at all, so a
  // one-liner is a routing bug rather than a style preference. Part 3 group A tests it.
  else if (description.length < 120) fail(path, `description is ${description.length} chars; too thin to route on`);
}

for (const skill of SKILLS) {
  const dir = join(ROOT, 'skills', skill);
  if (!existsSync(dir)) continue;
  const stray = readdirSync(dir).filter(entry => !['SKILL.md', 'references'].includes(entry));
  if (stray.length) fail(`skills/${skill}`, `unexpected entries: ${stray.join(', ')}`);
}

// ---------------------------------------------------------------------------
// 2. Sales vocabulary
// ---------------------------------------------------------------------------

// `contact` is banned as a noun for a person, but the reference itself says "contact
// details" and "make contact", so those survive. Everything else goes.
const CONTACT_EXCEPTIONS = /\bcontacts?\s+(details|information)\b|\bmake\s+contact\b/gi;

const SALES_TERMS = [
  [/\bprospect(s|ing|ed)?\b/gi, 'prospect'],
  [/\bICPs?\b/g, 'ICP'],
  [/\bbuying\s+(intent|signals?|group|committee)\b/gi, 'buying intent'],
  [/\bdecision[-\s]makers?\b/gi, 'decision maker'],
  [/\bseniority\b/gi, 'seniority (the reference says level)'],
  [/\bleads?\b/gi, 'lead'],
  [/\bcontacts?\b/gi, 'contact'],
];

// Only the prose is checked. Code spans and fenced blocks carry API field names such as
// `exclude.contacts.jobChangedAfterDate`, which are the upstream contract and not ours to
// rewrite — the server-side overlay leaves parameter names alone for the same reason.
// A `<!-- vocab-gate:off -->` region opts out explicitly, which section 1 of the reference
// needs in order to state the rule at all.
const prose = (text) => text
  .replace(/<!--\s*vocab-gate:off[\s\S]*?vocab-gate:on\s*-->/g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/`[^`]*`/g, ' ')
  .replace(CONTACT_EXCEPTIONS, ' ');

// Everything a host loads and shows the model. GEMINI.md is in here and README.md is not:
// the first is instruction text Gemini CLI reads, the second is for whoever maintains the
// repo and needs to be able to say the word "sales" when comparing the two surfaces.
const recruiterFacing = new Map([
  [CANONICAL_REFERENCE, readFileSync(join(ROOT, CANONICAL_REFERENCE), 'utf8')],
  ['GEMINI.md', readFileSync(join(ROOT, 'GEMINI.md'), 'utf8')],
  ...skillText,
]);

for (const [client, clientConfig] of Object.entries(config.clients)) {
  recruiterFacing.set(
    `plugin.config.json (${client} description)`,
    config.descriptionTemplate.replaceAll('{{label}}', clientConfig.label),
  );
}
recruiterFacing.set('plugin.config.json (display)', JSON.stringify(config.display));

for (const [where, text] of recruiterFacing) {
  const checked = prose(text);
  for (const [pattern, label] of SALES_TERMS) {
    const hits = checked.match(pattern);
    if (hits) fail(where, `sales vocabulary '${label}': ${[...new Set(hits)].join(', ')}`);
  }
}

// ---------------------------------------------------------------------------
// 3. Mirrored references
// ---------------------------------------------------------------------------

const canonical = readFileSync(join(ROOT, CANONICAL_REFERENCE), 'utf8');

for (const skill of SKILLS) {
  const mirror = `skills/${skill}/references/shared-reference.md`;
  if (!existsSync(join(ROOT, mirror))) {
    fail(mirror, 'missing; run npm run build');
    continue;
  }
  if (readFileSync(join(ROOT, mirror), 'utf8') !== canonical) {
    fail(mirror, 'differs from the canonical reference; run npm run build');
  }
}

// ---------------------------------------------------------------------------
// 4. Generated manifests
// ---------------------------------------------------------------------------

for (const [path, expected] of buildArtifacts(config)) {
  if (!existsSync(join(ROOT, path))) {
    fail(path, 'missing; run npm run build');
    continue;
  }
  if (readFileSync(join(ROOT, path), 'utf8') !== expected) {
    fail(path, 'stale; run npm run build and commit the result');
  }
}

// Asserted against the committed files rather than the generator, so a hand-edit is
// caught by what it broke and not only by the diff.
for (const [client, clientConfig] of Object.entries(config.clients)) {
  const manifest = JSON.parse(readFileSync(join(ROOT, clientConfig.manifest), 'utf8'));
  const servers = typeof manifest.mcpServers === 'string'
    ? JSON.parse(readFileSync(join(ROOT, manifest.mcpServers.replace(/^\.\//, '')), 'utf8')).mcpServers
    : manifest.mcpServers;
  const entry = servers?.[config.server.key];

  if (!entry) {
    fail(clientConfig.manifest, `no '${config.server.key}' MCP server entry`);
    continue;
  }

  const url = entry.httpUrl ?? entry.url;
  const expectedUrl = `${config.server.origin}/mcp/${clientConfig.store}`;
  if (url !== expectedUrl) {
    // The likely cause is a local test build left in the tree, so say so rather than
    // making someone diff two long URLs to notice the host changed.
    const localBuild = url?.endsWith(`/mcp/${clientConfig.store}`);
    fail(
      clientConfig.manifest,
      `endpoint is '${url}', expected '${expectedUrl}'`
      + (localBuild ? ` — looks like a local build; re-run \`npm run build\` with no ${ORIGIN_OVERRIDE_VAR}` : ''),
    );
  }

  // Gemini is the one host that reads `httpUrl`; giving it `url` fails silently at
  // install with no server and no error worth reading.
  if (clientConfig.httpUrlKey && !entry.httpUrl) fail(clientConfig.manifest, 'Gemini manifest must use httpUrl');
  if (!clientConfig.httpUrlKey && !entry.url) fail(clientConfig.manifest, 'manifest must use url');

  const expectedPlugin = `${clientConfig.store}${config.server.pluginHeaderSuffix}`;
  if (entry.headers?.['X-Lusha-Plugin'] !== expectedPlugin) {
    fail(clientConfig.manifest, `X-Lusha-Plugin is '${entry.headers?.['X-Lusha-Plugin']}', expected '${expectedPlugin}'`);
  }
  if (entry.headers?.['X-Lusha-Plugin-Version'] !== config.version) {
    fail(clientConfig.manifest, `X-Lusha-Plugin-Version is not ${config.version}`);
  }
  if (manifest.version !== config.version) fail(clientConfig.manifest, `version is not ${config.version}`);
}

// ---------------------------------------------------------------------------

if (issues.length) {
  console.error(`FAIL - ${issues.length} issue(s):\n`);
  for (const issue of issues) console.error(`  ${issue}`);
  process.exit(1);
}

console.log(
  `PASS - ${SKILLS.length} skills, ${buildArtifacts(config).size} generated files: ` +
  'frontmatter, vocabulary, mirrored references and manifests are clean.',
);
