// The single generator: every artifact derived from plugin.config.json, as a map of
// path to file contents. Pure, so `build-manifests` can write it and `check` can compare
// against what is committed without either duplicating the shapes.
//
// Generated rather than hand-maintained because the display name is Marketing's to change
// and the description is ~1,400 characters. Six hand-synced copies of that is six chances
// to update five of them.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const read = (path) => readFileSync(join(ROOT, path), 'utf8');
export const readJson = (path) => JSON.parse(read(path));

export const SKILLS = ['source-movable-talent', 'keep-a-list-live', 'leadership-change-sourcing'];

// Local testing points the manifests at a tunnel or at localhost instead of the recruiter
// host. It is an env override rather than an edit to plugin.config.json so that the
// committed endpoint is never the thing you change — and so `npm run check`, which reads
// the config and ignores the env, fails on a tree still carrying local endpoints.
export const ORIGIN_OVERRIDE_VAR = 'LUSHA_MCP_ORIGIN';

export function loadConfig() {
  const config = readJson('plugin.config.json');
  const override = process.env[ORIGIN_OVERRIDE_VAR];

  if (override) config.server.origin = override.replace(/\/$/, '');

  return config;
}

export const describeFor = (config, client) =>
  config.descriptionTemplate
    .replaceAll('{{label}}', client.label)
    .replaceAll('{{surface}}', client.surface);

// The plugin manifest's `description` is a brief, user-facing one-liner — Claude Code's
// install validation caps it at 500 characters, and the ~1,400-character descriptionTemplate
// is written for a marketplace listing, not a manifest field. Codex already split these two
// (a short top-level `description` plus `interface.longDescription`); this brings the other
// clients' plugin manifests in line with that rather than handing all of them the long copy.
export const briefDescriptionFor = (config) =>
  `${config.display.displayName}: ${config.display.shortDescription}.`;

// One MCP entry shape, two key names: Gemini reads `httpUrl`, everyone else `url` behind
// `type: "http"`.
export const serverEntryFor = (config, client) => {
  const { server, version } = config;
  const url = `${server.origin}/mcp/${client.store}`;
  const headers = {
    'X-Lusha-Plugin': `${client.store}${server.pluginHeaderSuffix}`,
    'X-Lusha-Plugin-Version': version,
  };

  return {
    [server.key]: client.httpUrlKey ? { httpUrl: url, headers } : { type: 'http', url, headers },
  };
};

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

export function buildArtifacts(config = loadConfig()) {
  const { name, version, license, repository, homepage, author, keywords, display, marketplace } = config;
  const { claude, cursor, codex, copilot, gemini } = config.clients;

  const common = () => ({
    name,
    version,
    description: briefDescriptionFor(config),
    author,
    homepage,
    repository,
    license,
    keywords,
  });

  const catalogEntry = () => ({
    name,
    source: './',
    version,
    description: briefDescriptionFor(config),
    author: { name: author.name },
    homepage,
    repository,
    license,
    keywords,
    category: display.category,
  });

  const artifacts = new Map();

  artifacts.set(claude.manifest, json({
    $schema: claude.schema,
    ...common(),
    mcpServers: serverEntryFor(config, claude),
  }));

  artifacts.set(cursor.manifest, json({
    ...common(),
    logo: cursor.logo,
    skills: cursor.skills,
    mcpServers: serverEntryFor(config, cursor),
  }));

  artifacts.set(copilot.manifest, json({
    ...common(),
    skills: copilot.skills,
    mcpServers: serverEntryFor(config, copilot),
  }));

  artifacts.set(gemini.manifest, json({
    name,
    version,
    description: briefDescriptionFor(config),
    mcpServers: serverEntryFor(config, gemini),
  }));

  // Codex splits the manifest from the server file and carries the store-listing fields.
  // Its top-level `description` is the one-liner; the long copy lives under `interface`.
  artifacts.set(codex.manifest, json({
    name,
    version,
    description: briefDescriptionFor(config),
    author,
    homepage,
    repository,
    license,
    keywords,
    skills: codex.skills,
    mcpServers: `./${codex.mcpServersFile}`,
    interface: {
      displayName: display.displayName,
      shortDescription: display.shortDescription,
      longDescription: describeFor(config, codex),
      developerName: display.developerName,
      category: display.category,
      capabilities: ['Interactive', 'Read'],
      websiteURL: display.websiteURL,
      privacyPolicyURL: display.privacyPolicyURL,
      termsOfServiceURL: display.termsOfServiceURL,
      defaultPrompt: display.defaultPrompt,
      brandColor: display.brandColor,
      composerIcon: './assets/logo.png',
      logo: './assets/logo.png',
      screenshots: [],
    },
  }));

  artifacts.set(codex.mcpServersFile, json({ mcpServers: serverEntryFor(config, codex) }));

  artifacts.set(claude.marketplaceCatalog, json({
    $schema: claude.marketplaceSchema,
    ...marketplace,
    plugins: [catalogEntry()],
  }));

  artifacts.set(cursor.marketplaceCatalog, json({
    ...marketplace,
    plugins: [catalogEntry()],
  }));

  // Codex installs by cloning the repo URL rather than from a local path, so the ref
  // pinned here is what an installed plugin follows.
  artifacts.set(codex.agentsCatalog, json({
    name: marketplace.name,
    interface: { displayName: `${display.displayName} Plugins` },
    plugins: [
      {
        name,
        source: { source: 'url', url: `${repository}.git`, ref: codex.agentsRef },
        policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
        category: display.category,
      },
    ],
  }));

  // Hosts differ on whether they bundle a directory outside the skill folder, so each
  // skill carries its own copy of the reference and CI enforces byte-equality with the
  // canonical one. A link would be one place, but not all three skills would arrive
  // intact.
  const sharedReference = read('skills/_shared/SHARED-REFERENCE.md');
  for (const skill of SKILLS) {
    artifacts.set(`skills/${skill}/references/shared-reference.md`, sharedReference);
  }

  return artifacts;
}
