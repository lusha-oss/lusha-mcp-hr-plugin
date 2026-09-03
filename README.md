# Lusha for Recruiting — MCP Plugin

Source talent for an open position, keep a saved talent pipeline current, and catch the
weeks after a leadership change — from inside your AI assistant.

Supports **Claude Code** (CLI / Cowork), **Cursor** (plugins), **Codex** (plugins), **VS
Code Copilot** (GitHub Copilot Chat with MCP), and **Gemini CLI** (extensions).

This is the recruiting counterpart of
[lusha-mcp-plugin](https://github.com/lusha-oss/lusha-mcp-plugin). Same shape, different
surface: it connects to the Lusha recruiting MCP deployment, which serves 26 tools under
recruiter-facing names (`talent_search`, `candidate_profile`, `list_read`) rather than the
general Lusha surface.

## Skills

| Skill | What it does |
|-------|-------------|
| `source-movable-talent` | A position to fill → an ordered shortlist of people who fit it and have been in their job long enough to be open to a move, each with a reason to approach them now |
| `keep-a-list-live` | A pipeline saved weeks ago → only what changed since the last check: who moved, who was promoted, who newly crossed the tenure threshold, what happened at their employer |
| `leadership-change-sourcing` | An executive departure or replacement → the people one level below, grouped by company, each traced to a dated event |

All three load the same shared reference: terminology, fifteen hard rules, the tenure
mechanism, the ordering rules and the cost table. The canonical copy is
`skills/_shared/SHARED-REFERENCE.md`; each skill carries a generated mirror at
`references/shared-reference.md`, because hosts differ on whether they bundle a directory
outside the skill folder. CI enforces byte-equality.

## How it works

Every client loads the **same** `skills/*/SKILL.md` files and the same MCP server. Only the
manifest and the store segment differ:

| Client | Manifest | MCP endpoint | How to invoke |
|--------|----------|--------------|---------------|
| Claude Code | `.claude-plugin/plugin.json` | `mcp-hr.lusha.com/mcp/claude` | `/source-movable-talent`, `/keep-a-list-live`, `/leadership-change-sourcing` |
| Cursor | `.cursor-plugin/plugin.json` | `mcp-hr.lusha.com/mcp/cursor` | Skills activate from natural language |
| Codex | `.codex-plugin/plugin.json` + `mcp.json` | `mcp-hr.lusha.com/mcp/codex` | Skills activate from natural language |
| VS Code Copilot | `.github/plugin/plugin.json` | `mcp-hr.lusha.com/mcp/copilot` | `/source-movable-talent`, etc. |
| Gemini CLI | `gemini-extension.json` | `mcp-hr.lusha.com/mcp/gemini` | Gemini activates the matching skill on demand |

Skills name tools by their bare recruiter-facing name, so one skill source works on every
client. Each manifest also sends `X-Lusha-Plugin: <store>-hr` and
`X-Lusha-Plugin-Version`, which is how usage from this plugin is attributed separately from
the general one.

**The host is the whole selector.** The recruiting surface is a dedicated deployment, not a
path: `mcp-hr.lusha.com` serves recruiter names on every mount, and `mcp.lusha.com` serves
the general ones. There is no `/mcp/hr` path — pointing a manifest at one gets an unknown
store.

## Prerequisites

- A Lusha account with API access, and the recruiting surface enabled for it

## Install

### Claude Code (CLI / Cowork)

```
/plugin marketplace add lusha-oss/lusha-mcp-talent-sourcing-plugin
/plugin install lusha-talent-sourcing
```

### Cursor

Cursor reads `.cursor-plugin/plugin.json` and discovers the bundled `skills/`
automatically. Add the repo as a plugin marketplace, then install from
`.cursor-plugin/marketplace.json` (catalog `lusha-recruiting-plugins`, plugin
`lusha-talent-sourcing`).

### Codex

Codex discovers the plugin through the repo catalog at `.agents/plugins/marketplace.json`,
which uses a `url` source pinned to a ref. A `url` source is used instead of a local path
because Codex rejects a local plugin path that resolves to the repo root
([codex#17066](https://github.com/openai/codex/issues/17066)) and silently drops symlinks
during install ([codex#18863](https://github.com/openai/codex/issues/18863)); cloning over
`url` keeps `skills/` as real files at the plugin root.

```
codex plugin marketplace add lusha-oss/lusha-mcp-talent-sourcing-plugin
codex
/plugins
```

Select the catalog, install, then start a new thread so the skills and MCP tools load.

### VS Code Copilot

Requires a VS Code version with agent-plugin support and the GitHub Copilot extension.

1. Open the **Command Palette** (`Cmd+Shift+P` / `Ctrl+Shift+P`).
2. Run **Chat: Install Plugin From Source**.
3. Paste the repository name: `lusha-oss/lusha-mcp-talent-sourcing-plugin`.

### Gemini CLI

```
gemini extensions install https://github.com/lusha-oss/lusha-mcp-talent-sourcing-plugin
```

## Editing this repo

**The manifests are generated. Do not hand-edit them.** `plugin.config.json` is the single
source for the name, version, description, display fields and per-client endpoint;
`scripts/build-manifests.mjs` writes the five manifests, `mcp.json` and the three catalogs
from it, and `scripts/check.mjs` fails if any committed file has drifted. This exists
because the display name is Marketing's to change and the description is ~1,400 characters:
six hand-synced copies is six chances to update five of them.

```
npm run build    # regenerate manifests + mirrored references
npm run check    # the CI gate, four checks
```

### Testing against a different endpoint

To point the plugin at a different recruiting MCP deployment (a staging environment, or a
locally-run one), set the `LUSHA_MCP_ORIGIN` env var before building rather than editing
`plugin.config.json`:

```
LUSHA_MCP_ORIGIN=https://<your-endpoint> npm run build
```

The committed endpoint is then never the thing you touch by hand, and `npm run check` —
which reads `plugin.config.json` and ignores the env override — fails on a tree still
carrying a non-production endpoint, so an accidental local build can't be committed.

`npm run check` enforces:

1. Every skill has parseable frontmatter whose `name` matches its folder, with a
   description long enough to route on.
2. **No sales vocabulary** in anything a host loads — no `prospect`, `ICP`, `buying
   intent`, `decision maker`, `seniority` (the reference says level) or `lead`, and
   `contact` only inside `contact details` / `contact information` / `make contact`.
   Code spans and fenced blocks are exempt, because they carry upstream API field names
   that are not ours to rewrite. A `<!-- vocab-gate:off -->` region opts out explicitly,
   which the reference needs in order to state the rule at all.
3. The mirrored shared references are byte-identical to the canonical one.
4. The manifests match `plugin.config.json`, Gemini uses `httpUrl`, and every endpoint,
   attribution header and version lines up.

This repo does not maintain its own copy of which tool names the recruiter MCP server
serves — that list is server-owned and changes on the server's schedule, so a skill
sending the model at a tool this surface doesn't have is caught server-side rather than by
a mirror here that could drift.

### Where the words come from

The skills and the shared reference are maintained by the Lusha recruiting team as the
source of truth for this plugin's terminology, guardrails and behaviour — if a skill file
and any other internal note disagree, the skill file wins.

### Placeholders

These are display-only fields, owned by Marketing, and all three live in
`plugin.config.json`:

| Field | Current value |
|-------|---------------|
| `display.displayName` | `Lusha Talent Sourcing` |
| `display.shortDescription` | `Find best-fit talent, get verified contact details, and see who may be open to a move` |
| `display.category` | `Productivity + data` — confirm against each host's accepted category list at submission |
| `descriptionTemplate` | The store-listing copy. It reaches Codex as `interface.longDescription` and Gemini as the manifest `description`; every other manifest gets the one-liner instead |

The long copy is written by Marketing but still passes the vocabulary gate above, so a
draft saying "seniority" or "contact data" comes back as `level` and `contact details`.

The machine name is `lusha-talent-sourcing`. It was `lusha-hr` in 0.1.0, so anyone who
installed that version reinstalls rather than updates. Treat it as fixed from here:
renaming it again after install breaks existing installs.

## License

MIT. See [LICENSE](LICENSE).
